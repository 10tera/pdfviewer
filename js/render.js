const ipcrender = require("electron").ipcRenderer;
const pdfjs=require("pdfjs-dist");
const {PDFDocument,RotationTypes}=require("pdf-lib");
pdfjs.GlobalWorkerOptions.workerSrc='../node_modules/pdfjs-dist/build/pdf.worker.js';



var aftermerge_pdfs=[];

var inputfiles_map=new Map();

async function downloadfiles(){
    return;
}

function datasend_beforemerge(){
    changewindow(3);
}

ipcrender.on("joinpdf",(event,arg1)=>{
    joinpdf(arg1);
})


async function joinpdf(arg1) {
    var viewdiv = document.getElementById("after-merge-div");


    const mergedpdf = await PDFDocument.create();
    aftermerge_pdfs = arg1;
    for (const value of aftermerge_pdfs) {
        const pdfbuffer=await fetch(value[1]).then(res=>res.arrayBuffer());
        //console.log(pdfbuffer);
        const pdf=await PDFDocument.load(pdfbuffer);
        const pages=await mergedpdf.copyPages(pdf,pdf.getPageIndices());
        pages.forEach((page)=>{
            mergedpdf.addPage(page);
        });

    }
    const merdefpdffile=await mergedpdf.save();
    const link=document.getElementById("aftermergefile-download");
    link.download="mergedfile";
    var binarydata=[];
    binarydata.push(merdefpdffile);
    link.href=URL.createObjectURL(new Blob(binarydata,{type:"application/pdf"}));

    arg1.forEach((value) => {
        var eachdiv = document.createElement("div");
        eachdiv.id = "aftermerge-eachfile-div" + value[1];
        viewdiv.appendChild(eachdiv);

        var loadingtask = pdfjs.getDocument(value[1]);
        loadingtask.promise.then((pdf) => {

            for (var i = 1; i <= pdf.numPages; i++) {
                var canvas = document.createElement("canvas");
                canvas.className = "after-merge-pdf";
                eachdiv.appendChild(canvas);
                pdf.getPage(i).then((page) => {
                    var viewport = page.getViewport({scale: 0.5, rotation: value[0] * 90});
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    var context = canvas.getContext("2d");
                    var renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    }
                    var rendertask = page.render(renderContext);
                    rendertask.promise.then(() => {
                        var br = document.createElement("br");
                        viewdiv.appendChild(br);
                        //bufferデータ取得
                        /*
                        const imgdata=canvas.getContext("2d").getImageData(0,0,canvas.width,canvas.height);

                        const bufferdata=imgdata.data.buffer;
                        console.log(bufferdata);

                         */
                    });
                });
            }
        });

    })
}

function addinputfiles(newfile){
    //inputfiles.push(newfile);
    inputfiles_map.set(newfile.path,[0,newfile]);

    /*描画の順序がバグるためエレメントを先に作成しておく*/
    const preview_area=document.getElementById("file-preview");
    var newdiv=document.createElement("div");
    newdiv.className="each-file-preview";
    newdiv.id="eachfile-"+newfile.path;
    preview_area.appendChild(newdiv);
    var div=document.getElementById("eachfile-"+newfile.path);
    var newcanvas=document.createElement("canvas");
    newcanvas.id="canvas-preview"+newfile.path;
    newcanvas.className="canvas-preview";
    div.appendChild(newcanvas);


    var loadingtask=pdfjs.getDocument(newfile.path);
    loadingtask.promise.then((pdf)=>{
        pdf.getPage(1).then((page)=>{
            var viewport=page.getViewport({scale:0.4,rotation:0});
            var canvas=document.getElementById("canvas-preview"+newfile.path);
            var context=canvas.getContext("2d");
            div.style.width=viewport.width+"px";
            div.style.height=viewport.height+40+"px";
            canvas.height=viewport.height;
            canvas.width=viewport.width;

            var renderContext={
                canvasContext:context,
                viewport:viewport
            }
            var rendertask=page.render(renderContext);
            rendertask.promise.then(()=>{
                var newrotatebutton=document.createElement("button");
                newrotatebutton.className="file-rotate-button";
                newrotatebutton.id=newfile.path+"rotate-button";
                newrotatebutton.type="button";
                div.appendChild(newrotatebutton);
                const rotatebutton=document.getElementById(newfile.path+"rotate-button");
                rotatebutton.addEventListener("click",(e)=>{
                    const key=e.target.id.slice(0,-13);
                    var rotate=inputfiles_map.get(key)[0];
                    const file=inputfiles_map.get(key)[1];
                    if(rotate===3){
                        rotate=0;
                    }
                    else{
                        rotate++;
                    }
                    var rotation;
                    switch (rotate){
                        case 0:
                            rotation=0;
                            break;
                        case 1:
                            rotation=90;
                            break;
                        case 2:
                            rotation=180;
                            break;
                        case 3:
                            rotation=270;
                            break;
                    }
                    var loadingtask=pdfjs.getDocument(key);
                    loadingtask.promise.then((pdf)=>{
                        var viewport=page.getViewport({scale:0.4,rotation:rotation});
                        var div=document.getElementById("eachfile-"+key);
                        var canvas=document.getElementById("canvas-preview"+key);
                        var context=canvas.getContext("2d");
                        div.style.width=viewport.width+"px";
                        div.style.height=viewport.height+40+"px";
                        canvas.height=viewport.height;
                        canvas.width=viewport.width;
                        var renderContext={
                            canvasContext:context,
                            viewport:viewport
                        }
                        var rendertask=page.render(renderContext);
                        rendertask.promise.then(()=>{

                        });
                    });


                    inputfiles_map.set(e.target.id.slice(0,-13),[rotate,file]);

                })
                var newdeletebutton=document.createElement("button");
                newdeletebutton.className="file-delete-button";
                newdeletebutton.id=newfile.path+"delete-button";
                newdeletebutton.type="button";
                div.appendChild(newdeletebutton);
                const deletebutton=document.getElementById(newfile.path+"delete-button");
                deletebutton.addEventListener("click",(e)=>{
                    const key=e.target.id.slice(0,-13);
                    inputfiles_map.delete(key);
                    const div=document.getElementById("eachfile-"+key);
                    div.remove();
                });
            });
        });
    });

}

function changewindow(window_number){
    //PDF VIEW
    if(window_number===1){
        ipcrender.send("changehtml","1");
    }
    //PDF ADD
    else if(window_number===2){
        ipcrender.send("changehtml","2");
    }
    else if(window_number===3){
        var data=[];
        Array.from(inputfiles_map.values()).forEach(e=>{
            data.push([e[0],e[1].path]);
        });
        console.log(data);

        ipcrender.send("changehtml","3",data);
    }
}