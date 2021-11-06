const electron = require("electron");
const app=electron.app;
const BrowserWindow=electron.BrowserWindow;
const Menu=electron.Menu;
const ipcMain=electron.ipcMain;

let mainwindow=null;

const template_menu = Menu.buildFromTemplate([
    {
        label:"ファイル",
        submenu:[
            {role:'close',label:'ウィンドウを閉じる'}
        ]
    },
    {
        label:"編集",
        submenu:[
            {role:'cut',label:'切り取り'},
            {role:'copy',label:'コピー'},
            {role:'paste',label:'貼り付け'}
        ]
    },
    {
        label:"表示",
        submenu:[
            {role:'reload',label:'再読み込み'},
            {role:'toggleDevTools',label:'開発者ツール表示'}
        ]
    },
    {
        label:"ウィンドウ",
        submenu:[
            {role:'minimize',label:'最小化'},
            {role:'togglefullscreen',label:'フルスクリーン切り替え'}
        ]
    },
    {
        label:"PDFツール",
        submenu:[
            {
                label:"testfunc",
                click:function (item,focusedwindow){
                    if(focusedwindow){
                        focusedwindow.webContents.executeJavaScript("testfunc()");
                    }}

            },
            {
                label:"PDF 結合",
                click:function (item,focusedwindow){
                    if(focusedwindow){
                        focusedwindow.webContents.executeJavaScript("pdfadd_func()");
                    }}

            },
            {
                label:"PDF ビュー",
                click:function (item,focusedwindow){
                    if(focusedwindow){
                        focusedwindow.webContents.executeJavaScript("pdfview_func()");
                    }}

            }
        ]
    }
]);

Menu.setApplicationMenu(template_menu);

function createmainwindow(){
    mainwindow=new BrowserWindow({
        width:800,
        height:600,
        webPreferences:{
            nodeIntegration:true,
            contextIsolation:false
        }
    })

    mainwindow.loadFile('index.html');
    //mainwindow.webContents.openDevTools();

    mainwindow.on('closed',()=>{
        mainwindow=null;
    })
}

app.on('ready',createmainwindow)

app.on('window-all-closed',()=>{
    if(process.platform!=='darwin'){
        app.quit()
    }
})

app.on('activate',()=>{
    if(mainwindow===null){
        createmainwindow()
    }
})


ipcMain.on("changehtml",async (event,arg,data1)=>{
    //PDF VIEW
    if(arg==="1"){
        mainwindow.loadFile('./page/pdfview.html');
    }
    //PDF ADD
    else if(arg==="2"){
        mainwindow.loadFile('./page/addpdf.html');
    }
    else if(arg==="3"){
        mainwindow.loadFile('./page/aftermerge.html').then(()=>{
            event.sender.send("joinpdf",data1);
        });

    }

})
