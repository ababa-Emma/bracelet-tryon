const stageEl = document.getElementById("stage");
const handInput = document.getElementById("handInput");
const braceletSelect = document.getElementById("braceletSelect");
const addBraceletBtn = document.getElementById("addBraceletBtn");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");

let stage, layer, tr;
let handImageNode = null;

function initStage() {
  stageEl.innerHTML = "";
  const width = stageEl.clientWidth;
  const height = stageEl.clientHeight;

  stage = new Konva.Stage({ container: "stage", width, height });
  layer = new Konva.Layer();
  stage.add(layer);

  tr = new Konva.Transformer({
    rotateEnabled: true,
    enabledAnchors: ["top-left","top-right","bottom-left","bottom-right"],
    boundBoxFunc: (oldBox, newBox) => {
      if (newBox.width < 40 || newBox.height < 40) return oldBox;
      return newBox;
    }
  });
  layer.add(tr);

  stage.on("click tap", (e) => {
    if (e.target === stage) {
      tr.nodes([]);
      layer.draw();
    }
  });

  layer.draw();
}

function fitImageToStage(konvaImage, img) {
  const sw = stage.width();
  const sh = stage.height();
  const scale = Math.min(sw / img.width, sh / img.height);
  konvaImage.width(img.width * scale);
  konvaImage.height(img.height * scale);
  konvaImage.x((sw - konvaImage.width()) / 2);
  konvaImage.y((sh - konvaImage.height()) / 2);
}

function loadLocalFile(file, cb) {
  const reader = new FileReader();
  reader.onload = () => cb(reader.result);
  reader.readAsDataURL(file);
}

function addKonvaImage(src, options = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const node = new Konva.Image({ image: img, ...options });
      layer.add(node);
      layer.draw();
      resolve({ node, img });
    };
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

function selectNode(node) {
  tr.nodes([node]);
  layer.draw();
}

function resetAll() {
  handImageNode = null;
  initStage();
}

window.addEventListener("resize", () => resetAll());
initStage();

handInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  loadLocalFile(file, async (dataUrl) => {
    if (handImageNode) handImageNode.destroy();
    const { node, img } = await addKonvaImage(dataUrl, { draggable: false });
    handImageNode = node;
    node.moveToBottom();
    fitImageToStage(node, img);
    tr.nodes([]);
    layer.draw();
  });
});

addBraceletBtn.addEventListener("click", async () => {
  if (!handImageNode) return alert("請先上傳手部照片！");
  const src = braceletSelect.value;

  const { node, img } = await addKonvaImage(src, { draggable: true });

  const sw = stage.width();
  const sh = stage.height();

  const baseW = Math.min(sw * 0.55, 520);
  const scale = baseW / img.width;

  node.width(img.width * scale);
  node.height(img.height * scale);
  node.x((sw - node.width()) / 2);
  node.y(sh * 0.62);

  node.on("click tap", () => selectNode(node));
  selectNode(node);
});

downloadBtn.addEventListener("click", () => {
  if (!handImageNode) return alert("請先上傳手部照片！");
  tr.nodes([]);
  layer.draw();

  const dataURL = stage.toDataURL({ pixelRatio: 2 });
  const a = document.createElement("a");
  a.href = dataURL;
  a.download = "bracelet-tryon.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
});

resetBtn.addEventListener("click", () => {
  handInput.value = "";
  resetAll();
});

