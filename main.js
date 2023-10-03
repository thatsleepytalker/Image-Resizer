const path = require("path");
const os = require("os");
const fs = require("fs");
const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");
const resizeImg = require("resize-img");

const isMac = process.platform === "darwin";

let mainWindow;
//Create Main Window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: "Image Resizer",
    width: 500,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile(path.join(__dirname, "./renderer/index.html"));
}

// Create about Window
function createAboutWindow() {
  const aboutWindow = new BrowserWindow({
    title: "About Image Resizer",
    width: 300,
    height: 300,
  });

  aboutWindow.loadFile(path.join(__dirname, "./renderer/about.html"));
}

//App Ready
app.whenReady().then(() => {
  createMainWindow();

  // Remove mainWIndow from memory
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// respond to ipcRenderer
ipcMain.on("image:resize", (e, options) => {
  options.dest = path.join(os.homedir(), "imageResizer");
  resizeImage(options);
});

// Ressize Image
async function resizeImage({ imgPath, width, height, dest }) {
  try {
    const newPath = await resizeImg(fs.readFileSync(imgPath), {
      width: +width,
      height: +height,
    });

    // Create Filename
    const filename = path.basename(imgPath);

    // create dest folder
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }

    // Write file to dest
    fs.writeFileSync(path.join(dest, filename), newPath);

    // Sned success message
    mainWindow.webContents.send("image:done");

    // open the dest folder
    shell.openPath(dest);
  } catch (error) {
    console.log(error);
  }
}

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});
