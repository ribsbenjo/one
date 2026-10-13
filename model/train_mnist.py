"""Train a small MNIST CNN in PyTorch and export it as a TensorFlow.js layers model.

Usage: python train_mnist.py <data_dir> <out_dir>
"""
import gzip, json, math, os, sys, urllib.request
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

data_dir, out_dir = sys.argv[1], sys.argv[2]
os.makedirs(data_dir, exist_ok=True)
os.makedirs(out_dir, exist_ok=True)

BASE = "https://storage.googleapis.com/cvdf-datasets/mnist/"
FILES = {
    "xtr": "train-images-idx3-ubyte.gz", "ytr": "train-labels-idx1-ubyte.gz",
    "xte": "t10k-images-idx3-ubyte.gz", "yte": "t10k-labels-idx1-ubyte.gz",
}

def load(key):
    path = os.path.join(data_dir, FILES[key])
    if not os.path.exists(path):
        urllib.request.urlretrieve(BASE + FILES[key], path)
    with gzip.open(path, "rb") as f:
        raw = f.read()
    if key.startswith("x"):
        return np.frombuffer(raw, np.uint8, offset=16).reshape(-1, 1, 28, 28).astype(np.float32) / 255.0
    return np.frombuffer(raw, np.uint8, offset=8).astype(np.int64)

dev = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
xtr, ytr, xte, yte = (torch.from_numpy(load(k)) for k in ("xtr", "ytr", "xte", "yte"))
xtr, ytr, xte, yte = xtr.to(dev), ytr.to(dev), xte.to(dev), yte.to(dev)


class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.c1 = nn.Conv2d(1, 32, 3)
        self.c2 = nn.Conv2d(32, 64, 3)
        self.d1 = nn.Linear(5 * 5 * 64, 128)
        self.d2 = nn.Linear(128, 10)

    def forward(self, x):
        x = F.max_pool2d(F.relu(self.c1(x)), 2)   # 26 -> 13
        x = F.max_pool2d(F.relu(self.c2(x)), 2)   # 11 -> 5
        x = x.permute(0, 2, 3, 1).flatten(1)      # flatten in HWC order to match Keras
        x = F.dropout(F.relu(self.d1(x)), 0.4, self.training)
        return self.d2(x)


def augment(x):
    """Random rotation / scale / shift so the model copes with hand-drawn input."""
    n = x.shape[0]
    ang = (torch.rand(n, device=dev) - 0.5) * 2 * math.radians(15)
    sc = 1 / (0.8 + torch.rand(n, device=dev) * 0.4)
    tx, ty = ((torch.rand(2, n, device=dev) - 0.5) * 2 * (3 / 14))
    cos, sin = torch.cos(ang) * sc, torch.sin(ang) * sc
    theta = torch.stack([torch.stack([cos, -sin, tx], 1), torch.stack([sin, cos, ty], 1)], 1)
    grid = F.affine_grid(theta, x.shape, align_corners=False)
    return F.grid_sample(x, grid, align_corners=False)


torch.manual_seed(0)
net = Net().to(dev)
opt = torch.optim.Adam(net.parameters(), 1e-3)
EPOCHS, BS = 8, 128
sched = torch.optim.lr_scheduler.OneCycleLR(opt, 3e-3, total_steps=EPOCHS * math.ceil(len(xtr) / BS))

for ep in range(EPOCHS):
    net.train()
    perm = torch.randperm(len(xtr), device=dev)
    for i in range(0, len(xtr), BS):
        idx = perm[i:i + BS]
        loss = F.cross_entropy(net(augment(xtr[idx])), ytr[idx])
        opt.zero_grad(); loss.backward(); opt.step(); sched.step()
    net.eval()
    with torch.no_grad():
        acc = (net(xte).argmax(1) == yte).float().mean().item()
    print(f"epoch {ep + 1}: test accuracy {acc:.4f}", flush=True)

# ---- Export to TensorFlow.js layers format ----
sd = {k: v.detach().cpu().numpy() for k, v in net.state_dict().items()}
weights = [
    ("conv2d/kernel", sd["c1.weight"].transpose(2, 3, 1, 0)),  # OIHW -> HWIO
    ("conv2d/bias", sd["c1.bias"]),
    ("conv2d_1/kernel", sd["c2.weight"].transpose(2, 3, 1, 0)),
    ("conv2d_1/bias", sd["c2.bias"]),
    ("dense/kernel", sd["d1.weight"].T),                        # (out,in) -> (in,out)
    ("dense/bias", sd["d1.bias"]),
    ("dense_1/kernel", sd["d2.weight"].T),
    ("dense_1/bias", sd["d2.bias"]),
]


def conv(name, filters, extra=None):
    cfg = {"name": name, "trainable": True, "filters": filters, "kernel_size": [3, 3],
           "strides": [1, 1], "padding": "valid", "data_format": "channels_last",
           "dilation_rate": [1, 1], "activation": "relu", "use_bias": True}
    cfg.update(extra or {})
    return {"class_name": "Conv2D", "config": cfg}


def pool(name):
    return {"class_name": "MaxPooling2D", "config": {"name": name, "trainable": True,
            "pool_size": [2, 2], "strides": [2, 2], "padding": "valid", "data_format": "channels_last"}}


def dense(name, units, act):
    return {"class_name": "Dense", "config": {"name": name, "trainable": True, "units": units,
            "activation": act, "use_bias": True}}


layers = [
    conv("conv2d", 32, {"batch_input_shape": [None, 28, 28, 1], "dtype": "float32"}),
    pool("max_pooling2d"),
    conv("conv2d_1", 64),
    pool("max_pooling2d_1"),
    {"class_name": "Flatten", "config": {"name": "flatten", "trainable": True, "data_format": "channels_last"}},
    dense("dense", 128, "relu"),
    {"class_name": "Dropout", "config": {"name": "dropout", "trainable": True, "rate": 0.4}},
    dense("dense_1", 10, "softmax"),
]

with open(os.path.join(out_dir, "model.bin"), "wb") as f:
    for _, w in weights:
        f.write(np.ascontiguousarray(w, dtype="<f4").tobytes())

model = {
    "format": "layers-model",
    "generatedBy": "PyTorch (manual export)",
    "convertedBy": None,
    "modelTopology": {"class_name": "Sequential", "config": {"name": "sequential", "layers": layers},
                      "keras_version": "2.15.0", "backend": "tensorflow"},
    "weightsManifest": [{"paths": ["model.bin"], "weights": [
        {"name": n, "shape": list(w.shape), "dtype": "float32"} for n, w in weights]}],
}
with open(os.path.join(out_dir, "model.json"), "w") as f:
    json.dump(model, f)

# Save a few test samples + expected outputs for verifying the export in the browser
with torch.no_grad():
    probs = F.softmax(net(xte[:5]), 1).cpu().numpy()
np.save(os.path.join(data_dir, "check.npy"), {"x": xte[:5].cpu().numpy(), "p": probs}, allow_pickle=True)
json.dump({"x": xte[:5].cpu().numpy().reshape(5, -1).round(4).tolist(), "p": probs.round(5).tolist()},
          open(os.path.join(data_dir, "check.json"), "w"))
print("exported to", out_dir)
