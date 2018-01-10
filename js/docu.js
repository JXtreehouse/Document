var app;
var copy;
var myDate = new Date();
var mytime= myDate.toLocaleTimeString();
var config = {
    colorSele : 0x8470FF,
    colorDef : 0xffffff,
    cameraStartPos:[23, 12,-23],
    cameraStartTar:[14,0, -14],
    cameraDelay : 1000,
    bgcolor: 0xffffff00
}
window.onload = function () {
    app = new t3d.App({
        el: "div3d",
        // url: "https://speech.uinnova.com/static/models/NARA",
        url: "https://uinnova-model.oss-cn-beijing.aliyuncs.com/scenes/NARA",
        ak:'app_test_key',
        complete: function () {
            console.log("app scene loaded");
            appinit(config);
        }
    });
}
get_filesdata();
// 初始化场景/数据
var docu = [];
function appinit(c) {
    //数据收集
    docu.fileBoxs = app.query( '[物体类型=档案柜]' );
    docu.sensors = app.query( '[物体类型=温湿度感应器]' );
    docu.smoke = app.query( '[物体类型=烟感]' );
    docu.cameras = app.query( '[物体类型=摄像头]' );
    docu.pipes = [];
    docu.versions = [];
    docu.floors = app.buildings[0].floors;
    docu.floors[0].showRoof(false);
    docu.floors[0].showCeiling(false);
    docu.wallMat = [];
    docu.bookLenArr = {};
    docu.books = [];
    // 档案柜详情。书卷的数量
    docu.boxInfo = '';
    docu.booksCount = 0;
    
    docu.viewsPos=[];
    docu.viewsTaregt=[11.7,-1.5,-17.51];
    docu.viewsPos.A = [25,9.7,-6.6];
    docu.viewsPos.B = [28,11.7,-13.3];
    docu.viewsPos.C = [-2,10,-13.97];
    docu.viewsPos.D1 = [-4.6,11,-21.3];
    docu.viewsPos.D2 = [18,11,-26];
    
    //资源 ui
    docu.sensorEle = document.getElementById( "mark_sensor" );
    docu.smokeEle = document.getElementById( "mark_smoke" );
    docu.cameraEle = document.getElementById( "mark_camera" );
    docu.div3d = document.getElementById( "div3d" );
    
    // 初始化设置（隐藏房顶、天花板、消防管）
    docu.wallMat.push(app.buildings[0].floors[0].wallNode.children[0].children[0].children[0].material);
    docu.wallMat.push(app.buildings[0].floors[0].wallNode.children[0].children[0].children[1].material);
    for(var i = 1;i <= 6;i++){
        docu.pipes.push(app.query( 'cube'+i.toString() ));
    }
    docu.pipes.forEach(function (t) { t[0].visible = false });
    docu.cameras.forEach(function (obj) { add_versions(obj.position,[0,0,-20])});
    docu.versions.forEach(function (t) { app.debug.scene.add(t);t.visible=false });
    
    //事件注册
    docu.fileBoxs.on('singleclick', click_fileBoxs_callback);
    docu.fileBoxs.on('dblclick', dblclick_fileBoxs_callback);
    
    // 绑定click事件,目前主要处理右键
    app.on('mouseup', click_fileBoxs_callback);
    
    app.debug.bOutline=true;
    create_gps_panel();
    create_up_buttons();
    // create_sensor_icons();
    app.camera.flyTo({
        position: config.cameraStartPos,
        target: config.cameraStartTar,
        time: config.cameraDelay
    });
}
function get_filesdata(){
    var jsondata={};
    $.getJSON("js/json/userinfo.json", function (data,status){
        // console.log("是否成功读到数据？ ------ "+status);
        if( status=='success'){
            jsondata = data;
            // 处理数据
            resolve_fileboxes_data(jsondata);
            return jsondata;
        }else{
            // console.log("没有读取到本地文件："+status);
            return false;
        }
    })
}
// 处理全部档案柜数据
function resolve_fileboxes_data(jsondata) {
    var data = jsondata.content;
    var library = {};
    for(var i = 0 ; i < data.length; i++){
        var item = data[i];
        if(item.columns.No.length == 3){
            if(!library[item.columns.No]){
                library[item.columns.No] = {};
            }
            library[item.columns.No].name = item.columns.URLStr;
            library[item.columns.No].id = item.columns.No;
            continue;
        }
        if(item.columns.No.length == 6){
            var parent = item.columns.No.slice(0, 3);
            if(!library[parent]){
                library[parent] = {};
            }
            var lib = {};
            lib.name = item.columns.URLStr;
            lib.id = item.columns.No;
            library[parent][item.columns.No] = lib;
            continue;
        }
        if(item.columns.No.length == 9){
            var grentP = item.columns.No.slice(0, 3);
            var parent = item.columns.No.slice(0, 6);
            var no = item.columns.No.slice(0, 8);
            if(!library[grentP]){
                library[grentP] = {};
            }
            if(!library[grentP][parent]){
                library[grentP][parent] = {};
            }
            var lib = {};
            var length = item.columns.URLStr.indexOf('列');
            lib.name = item.columns.URLStr.slice(0, length + 1);
            lib.id = no;
            library[grentP][parent][no] = lib;
            continue;
        }
    }
    copy = {'root':library};
    // console.log(copy)
    return copy;
}
// 处理成导航面板需要的数据
function transArray() {
    var o = {};
    o.kus = [];
    for(var ku in copy.root){
        var kuObj = {};
        var lib = copy.root[ku];
        kuObj.name = lib.name;
        kuObj.id = lib.id;
        o.kus.push(kuObj);
    }
    for(var i = 0; i < o.kus.length; i++){
        o.kus[i].qus = [];
        var index = '00' + (i+1).toString();
        for(var qu in copy.root[index]){
            if(copy.root[index][qu].hasOwnProperty("id")){
                var quObj = {};
                var lib = copy.root[index][qu];
                quObj.name = lib.name;
                quObj.id = lib.id;
                o.kus[i].qus.push(quObj);
            }
        }
    }
    for(var i = 0; i < o.kus.length; i++){
        for(var j = 0; j < o.kus[i].qus.length; j++){
            o.kus[i].qus[j].lies = [];
            var indexKu = '00' + (i+1).toString();
            var indexQu = indexKu + '00' + (j+1).toString();
            for(var lie in copy.root[indexKu][indexQu]){
                if(copy.root[indexKu][indexQu][lie].hasOwnProperty("id")){
                    var lieObj = {};
                    var lib = copy.root[indexKu][indexQu][lie];
                    lieObj.name = lib.name;
                    lieObj.id = lib.id;
                    o.kus[i].qus[j].lies.push(lieObj);
                }
            }
        }
    }
    return o;
}
var testObj;var guiMd;
// 创建导航面板
function create_gps_panel() {
    guiMd = new dat.gui.GUI({type: 'nav-md3'});
    var temp = transArray();
    var f = guiMd.addTree('档案馆', temp, 'kus.qus.lies', 'name')
    guiMd.domElement.style.height = (window.innerHeight - 226)+'px';
    // guiMd.domElement.style.top = '200px';
    guiMd.setPosition(null, null, 0, 0);/*top right bottom left*/
    guiMd.treeBind('click', function(o) {
        if(app.query('danganjuan').length > 0){
            app.query('danganjuan').forEach(function (obj) {
                // obj.off('mousemove');
                // obj.off('mousedown');
                obj.visible=false;
                obj.destroy();
            })
        }
        // console.log(o.id);
        if(o.id){
            if(o.hasOwnProperty('id') && o.id.length == 8){
                var name = o.name;
                var tab2 = '档案馆-'+name.substring(0,2);
                var tab3;
                if(name.substring(2,3) == "D"){
                    tab3 = name.substring(0,5);
                }else{
                    tab3 = name.substring(0,4);
                }
                // console.log('档案馆.'+tab2+'.'+tab3+'.'+name);
                guiMd.pathHighLight('档案馆.'+tab2+'.'+tab3+'.'+name);
                var target = app.query(o.id);
                docu.fileBoxs.forEach(function (t) { t.visible = false });
                target.visible = true;
                set_wallopacity(0.5);
                app.camera.flyTo({
                    position: [target[0].position[0]-4, target[0].position[1]+2.14,target[0].position[2]+1.14],
                    target: [target[0].position[0]+6, target[0].position[1]+1.306,target[0].position[2]+1.7],
                    time: 1000
                });
                click_filebox(o.id);
        
                // testObj = create_shujuan(target[0].pos,[1,1,1]);
            }else if(o.name.indexOf("-")>-1){
                var name = o.name;
                guiMd.pathHighLight('档案馆.'+name);
            } else{
                var name = o.name;
                var tab2 = '档案馆-'+name.substring(0,2);
                guiMd.pathHighLight('档案馆.'+tab2+'.'+name);
                var pos,target;
                target = docu.viewsTaregt;
                switch (name){
                    case "1库A区": pos = docu.viewsPos.A;break;
                    case "1库B区": pos = docu.viewsPos.B;break;
                    case "1库C区": pos = docu.viewsPos.C;break;
                    case "1库D1区": pos = docu.viewsPos.D1;break;
                    case "1库D2区": pos = docu.viewsPos.D2;break;
                    default:pos = config.cameraStartPos;target = config.cameraStartTar;break;
                }
                set_wallopacity(1);
                docu.fileBoxs.forEach(function (t) { t.visible = true });
                app.camera.flyTo({
                    position: pos,
                    target: target,
                    time: config.cameraDelay
                });
            }
        }else if(o=="档案馆"){
            guiMd.pathHighLight('档案馆');
            set_wallopacity(1);
            docu.fileBoxs.forEach(function (t) { t.visible = true });
            app.camera.flyTo({
                position: config.cameraStartPos,
                target: config.cameraStartTar,
                time: config.cameraDelay
            });
        }
       
    });
    guiMd.setZIndex(5001);
    // docu.div3d.insertBefore(guiMd.domElement,docu.div3d.lastChild);
    document.getElementsByClassName("logoBG")[0].style.top = 0+'px';
    document.getElementsByClassName("logoBG")[0].style.zIndex = 5000;
}
// 点击档案柜处理档案柜中档案数据
function click_filebox( number ) {
    var jsondata={};
    if(number.substring(0,6) == '001001' || number.substring(0,6) == '001002'){
        $.getJSON("js/json/"+ number +".json", function (data,status){
            // console.log("是否成功读到档案柜数据？ ------ "+status);
            if( status=='success'){
                jsondata = data;
                // 处理数据
                resolve_filebox_data( number,jsondata );
                return jsondata;
            }else{
                // console.log("没有读取到本地文件："+status);
                return false;
            }
        })
    }else{
        console.log('没有'+number+'档案柜数据！！！');
        if(app.query('danganjuan').length > 0){
            app.query('danganjuan').forEach(function (obj) {
                obj.off('mousemove');
                obj.off('mousedown');
                obj.destroy();
            })
        }
    }
}
var uidList = [];
function resolve_filebox_data( uid,jsondata ) {
    var posx,posy,posz;
    var lieCount,saixuan,cengCount;
    var qu = uid.substr(0,6);
    var qu2 = uid.substr(0,8);
    var centerPos = app.query(qu2)[0].position;
    switch (qu){
        case "001001":lieCount=5; saixuan='[1,2,3,4,5]';break;
        case "001002":lieCount=8; saixuan='[1,2,3,4,5,6,7,8]';break;
        case "001003":lieCount=6; saixuan='[1,2,3,4,5,6]';break;
        case "001004":lieCount=7; saixuan='[1,2,3,4,5,6,7]';break;
        case "001005":lieCount=7; saixuan='[1,2,3,4,5,6,7]';break;
        case "002001":lieCount=6; saixuan='[1,2,3,4,5,6]';cengCount=8;break;
        case "002002":lieCount=6; saixuan='[1,2,3,4,5,6]';cengCount=5;break;
        case "002003":lieCount=6; saixuan='[1,2,3,4,5,6]';cengCount=6;break;
        case "002004":lieCount=4; saixuan='[1,2,3,4]';break;
        // case "002005":lieCount=9; saixuan='[1,2,3,4,5,6,7,8,9]';break;
        // case "002006":lieCount=9; saixuan='[1,2,3,4,5,6,7,8,9]';break;
        // case "002007":lieCount=5; saixuan='[1,2,3,4,5,]';break;
        case "003001":lieCount=6; saixuan='[1,2,3,4,5,6]';cengCount=6;break;
        case "003002":lieCount=6; saixuan='[1,2,3,4,5,6]';cengCount=6;break;
        case "003003":lieCount=5; saixuan='[1,2,3,4,5]';cengCount=8;break;
        case "003004":lieCount=6; saixuan='[1,2,3,4,5,6]';cengCount=4;break;
    }
    
    var content = jsondata.content;
    var contentLen = content.length;
    docu.booksCount = contentLen;
    var sideLieCeng = {};           // 书柜中的书卷集合
    for(var i = 0; i < contentLen; i++){
        var data = content[i].columns;
        var dahPos = data["z_req"].substr(8);    // 从‘面’开始取
        // 判断 sideLieCeng[dahPos] 类型
        sideLieCeng[dahPos] = Object.prototype.toString.call(sideLieCeng[dahPos]) ==="[object Undefined]"?[]:sideLieCeng[dahPos];
        sideLieCeng[dahPos].push(data);
    }
    if(contentLen > 0){
        var num = content[0].columns.URLStr.indexOf("列");
        var posText = content[0].columns.URLStr.substring(0, num + 1);
        docu.boxInfo = posText;
    }
    docu.bookLenArr = sideLieCeng;
    for(var key in sideLieCeng){
        var bookLength = 0;
        var value = sideLieCeng[key];
        value.sort(function (a,b) {
            return a.ID - b.ID;
        });
        value.forEach(function (val, index, arr) {
            var dahPos = val["z_req"];
            var bookId = val.heHao;
            var bookname = val.Name;
            var bookState = val.State;
            var booklen1 = val.FrameLength;
            var booklen2 = booklen1*0.25;
            bookLength = bookLength + parseFloat(val.FrameLength);
            var posArr ;
            
            if(qu == '003002'){
                // posArr = safer.suanPos2(dahPos, centerPos, lieCount);
            }else if (qu == '001001'||qu =='001002'||qu =='001003'||qu =='001004') {
                posArr = caculate_pos(dahPos, centerPos, lieCount);
            }else {
                // posArr = suanPos1(dahPos, centerPos, lieCount, cengCount);
            }
            // 生成相对的档案
            posx = posArr.x; posy = posArr.y; posz = posArr.z - (index-1)*0.016;
            var pos = [posx, posy, posz];
            scalex = booklen2;
            var scale = [0.25,0.9,1];
            create_shujuan(pos,scale,uid,bookname,bookState);
        });
        docu.bookLenArr[key]=bookLength;
    }
    // console.log("当前位置："+docu.boxInfo+";</br>档案数量"+docu.booksCount+"本");
}
var shujuan_IframeUI = null;
function create_shujuan( pos,scale,num,name,state ) {
    // 创建单个物体
    var obj = app.create({
        type: 'Thing',
        name: 'danganjuan',
        url: 'models/danganjuan',
        position: pos,
        style: {
            color: 0xffffff
        },
        angle: 90,
        complete: function (obj) {
            obj.scale = [scale[0],scale[1],scale[2]];
            // console.log(obj.scale);
            obj.on('mousemove', function() {
                app.query('danganjuan').forEach(function (t) { t.scale=[0.25,0.9,1];});
                // console.log("mousemove");
                obj.scale=[0.25,1,1];
                // console.log(obj.scale);
                // obj.style.color = 'green';
            })
            obj.on('mousedown',function () {
                // console.log(obj + "mousedown");
                app.query('danganjuan').forEach(function (t) { t.scale=[0.25,0.9,1];});
                obj.scale=[0.25,1,1];
                // obj.style.color = 'green';
                openbook(name,state);
            })
        }
    });
    return obj;
}
//算每个卷图的初始位置
function caculate_pos(str, dagCenterPos, lieCount){
    var centerDAG_X = +dagCenterPos[0];
    var centerDAG_Y = +dagCenterPos[1];
    var centerDAG_Z = +dagCenterPos[2];
    var slcArr = str.substr(8).split("00");
    var side = slcArr[0];
    var lie = slcArr[1];
    var ceng = slcArr[2];
    var arr={};
    var aB = side==1?"A":"B";
    var daglie = str.substr(6,2);
    arr.pos = daglie+"列"+aB+"面"+lie+"节"+ceng+"层";
    arr.x = side=="1"? centerDAG_X+0.13:centerDAG_X-0.13;
    arr.y = centerDAG_Y + 2.36-((ceng-1)*0.386);
    arr.aorb = aB;
    switch (lieCount.toString()){
        case "5":{
            switch (lie){
                case "1":{arr.z = centerDAG_Z+2.44;break;}
                case "2":{arr.z = centerDAG_Z+1.57;break;}
                case "3":{arr.z = centerDAG_Z+0.7;break;}
                case "4":{arr.z = centerDAG_Z-0.17;break;}
                case "5":{arr.z = centerDAG_Z-1.04;break;}
            }
            break;
        }
        case "8":{
            switch (lie){
                case "1":{arr.z = centerDAG_Z+3.77;break;}
                case "2":{arr.z = centerDAG_Z+2.9;break;}
                case "3":{arr.z = centerDAG_Z+2.03;break;}
                case "4":{arr.z = centerDAG_Z+1.16;break;}
                case "5":{arr.z = centerDAG_Z+0.29;break;}
                case "6":{arr.z = centerDAG_Z-0.58;break;}
                case "7":{arr.z = centerDAG_Z-1.45;break;}
                case "8":{arr.z = centerDAG_Z-2.32;break;}
            }
            break;
        }
        case "6":{
            switch (lie){
                case "1":{arr.z = centerDAG_Z+2.97;break;}
                case "2":{arr.z = centerDAG_Z+2.12;break;}
                case "3":{arr.z = centerDAG_Z+1.26;break;}
                case "4":{arr.z = centerDAG_Z+0.39;break;}
                case "5":{arr.z = centerDAG_Z-0.47;break;}
                case "6":{arr.z = centerDAG_Z-1.36;break;}
            }
            break;
        }
        case "7":{
            switch (lie){
                case "1":{arr.z = centerDAG_Z+2.63;break;}
                case "2":{arr.z = centerDAG_Z+1.76;break;}
                case "3":{arr.z = centerDAG_Z+0.89;break;}
                case "4":{arr.z = centerDAG_Z+0.01;break;}
                case "5":{arr.z = centerDAG_Z-0.84;break;}
                case "6":{arr.z = centerDAG_Z-1.73;break;}
                case "7":{arr.z = centerDAG_Z-2.59;break;}
            }
            break;
        }
    }
    return arr;
}

// 修改墙的透明度
function set_wallopacity( value ) {
    docu.wallMat.forEach(function (t) { t.transparent = true ; t.opacity = value})
}

// 点击档案柜变色
var selectedObjects = [];
function click_fileBoxs_callback() {
    docu.fileBoxs.forEach(function ( obj ) {
        obj.on('click',function () {
            obj.style.color = this.colorDef;
            selectedObjects = [];
            selectedObjects.push( obj.node );
            app._real.outlinePass.selectedObjects = selectedObjects;
        });
    })
}
function dblclick_fileBoxs_callback() {

}

// 温湿度感应器图标
function create_sensor_icons() {
    var index = 0;
    docu.sensors.forEach(function (obj) {
        index += 1;
        var thatIndex = index;
        var icon = docu.sensorEle.cloneNode(true);
        icon.style.display = "block";
        icon.style.zIndex = 100;
        document.getElementById("div3d").insertBefore(icon, docu.sensorEle);
        obj.addUI(icon, [0, obj.size[1], 0 ],[0.2,1]);
        icon.addEventListener( 'click', function () {
            var str = thatIndex.toString();
            // 隐藏icon 创建info面板
            obj.removeUI();
            icon.style.display = 'none';
            var data = {
                name:'温湿度'+str,
                temprature:Math.ceil(Math.random()*30+20)+"℃",
                date:/*'2015-1-14'*/myDate.toLocaleDateString(),
                time:/*'8:30:00'*/mytime
            }
            var gui = new dat.gui.GUI({
                type: 'signboard2',
                name: '温度异常',
                isClose: true,
                isDrag: true,
                opacity: 0.9,
                hasTitle: true,
                domWidth: '200px',
                t3d: app
            });
            gui.add(data, 'name').name('名字');
            gui.add(data, 'temprature').name('温度');
            gui.add(data, 'date').name('日期');
            gui.add(data, 'time').name('时间');
            // 这里怎么加同位置的ui
            obj.addUI(gui.domElement, [0, obj.size[1], 0 ],[0.2,1]);
            gui.setZIndex(100);
            obj.uiDom = gui;
            gui.__closeButton.onclick = function () {
                icon.style.display = 'block';
                obj.uiDom.destroy();
                obj.removeUI();
                obj.uiDom = null;
                obj.addUI(icon, [0, obj.size[1], 0 ],[0.2,1]);
            }
        })
        
    })
}
var bookUI;var data;
// 打开书本信息
function openbook( bookName,stateNum ) {
    var state = stateNum == 0 ? "未借出" : "借出";
    if( bookUI == null ){
        data = {
            name:bookName,
            state:state
        };
        bookUI = new dat.gui.GUI({
            type: 'signboard2',
            name: '书卷信息',
            opacity: 0.9,
            hasTitle: true,
            isClose: true,
            domWidth: '200px',
            t3d: app
        });
        bookUI.add(data, 'name').name( '书名' );
        bookUI.add(data, 'state').name( '借用状态' );
        bookUI.setPosition('350px',null,null,'300px');
        bookUI.__closeButton.onclick = function () {
            bookUI = null;
        }
        bookUI.domElement.style.zIndex = 5000;
    }else{
        data.name = bookName;
        data.state = state;
    }
}
// 创建上排图标
function create_up_buttons() {
    var obj = {
        temperature: false,
        measure: false,
        smoke: false,
        fireControl: false,
        monitor: false,
        entrance: false,
        animation: false,
        open: false,
        snapshoot: false
    }
    var gui = new dat.gui.GUI({
        // type: 'icon1'
        type: 'icon3'
    });
    // gui.domElement.style.background = 'rgba(0, 0, 0, 0)';
    // gui.domElement.style.width = 395+'px';
    gui.setPosition({top: 0, left: 226});
    var img0 = gui.addImageBoolean(obj, 'temperature').name('温湿度');
    // var img1 = gui.addImageBoolean(obj, 'measure').name('测量');
    var img2 = gui.addImageBoolean(obj, 'smoke').name('烟感');
    var img3 = gui.addImageBoolean(obj, 'fireControl').name('消防');
    var img4 = gui.addImageBoolean(obj, 'monitor').name('监控');
    // var img5 = gui.addImageBoolean(obj, 'entrance').name('门禁');
    // var img6 = gui.addImageBoolean(obj, 'animation').name('动画');
    var img7 = gui.addImageBoolean(obj, 'open').name('盲区');
    // var img8 = gui.addImageBoolean(obj, 'snapshoot').name('快照');
    
    docu.div3d.insertBefore(gui.domElement,docu.div3d.lastChild);
    gui.setZIndex(5000);
    
    img0.imgUrl('http://demo.3dmomoda.com:8083/momodaKeeper/source/images/icon1.png');
    // img1.imgUrl('http://demo.3dmomoda.com:8083/momodaKeeper/source/images/icon2.png');
    img2.imgUrl('http://demo.3dmomoda.com:8083/momodaKeeper/source/images/icon3.png');
    img3.imgUrl('http://demo.3dmomoda.com:8083/momodaKeeper/source/images/icon4.png');
    img4.imgUrl('http://demo.3dmomoda.com:8083/momodaKeeper/source/images/icon5.png');
    // img5.imgUrl('http://demo.3dmomoda.com:8083/momodaKeeper/source/images/icon6.png');
    // img6.imgUrl('http://demo.3dmomoda.com:8083/momodaKeeper/source/images/icon7.png');
    img7.imgUrl('http://demo.3dmomoda.com:8083/momodaKeeper/source/images/icon8.png');
    // img8.imgUrl('http://demo.3dmomoda.com:8083/momodaKeeper/source/images/icon9.png');
    
    img0.hover('http://demo.3dmomoda.com:8083/momodaKeeper/source/images/icon-1.png');
    // img1.hover('http://demo.3dmomoda.com:8083/momodaKeeper/source/images/icon-2.png');
    img2.hover('http://demo.3dmomoda.com:8083/momodaKeeper/source/images/icon-3.png');
    img3.hover('http://demo.3dmomoda.com:8083/momodaKeeper/source/images/icon-4.png');
    img4.hover('http://demo.3dmomoda.com:8083/momodaKeeper/source/images/icon-5.png');
    // img5.hover('http://demo.3dmomoda.com:8083/momodaKeeper/source/images/icon-6.png');
    // img6.hover('http://demo.3dmomoda.com:8083/momodaKeeper/source/images/icon-7.png');
    img7.hover('http://demo.3dmomoda.com:8083/momodaKeeper/source/images/icon-8.png');
    // img8.hover('http://demo.3dmomoda.com:8083/momodaKeeper/source/images/icon-9.png');

    var boxs = [];
    img0.onChange(function( bool ){
        if(bool){
            for(var i = 0; i < docu.sensors.length; i++){
                var obj = docu.sensors[i];
                var box;
                if( boxs.length != docu.sensors.length){
                    box = app.create({type: 'Box',width: 0.1,height: 0.1,depth: 0.1,style: {opacity: 0},
                        position:[obj.position[0],obj.position[1],obj.position[2]]});
                    boxs.push(box);
                }else{
                    box = boxs[i];
                }
                var tempRand = Math.ceil(Math.random()*100);
                var humiRand = Math.ceil(Math.random()*100);
                var data = {
                    // name:'温湿度' + (i+1).toString() + '\n' + '2015-1-14 8:30:00',
                    name:'',
                    // time:'2015-1-14 8:30:00',
                    // temprature: tempRand+"℃",
                    tempMaxSize: tempRand,
                    // humidity:humiRand+"%",
                    humiMaxSize: humiRand
                }
                var gui = new dat.gui.GUI({
                    type: 'signboard2',
                    // name: '温度异常',
                    // isClose: true,
                    // isDrag: true,
                    opacity: 0.9,
                    // hasTitle: true,
                    domWidth: '300px',
                    t3d: app
                });
                gui.add(data, 'name').name('温湿度' + (i+1).toString() + '</br>'+myDate.toLocaleDateString()+' '+mytime );
                // gui.add(data, 'time').name('');
                // gui.add(data, 'temprature').name('℃温度');
                gui.add(data, 'tempMaxSize').name('温度 ℃').step(1).min(0).max(100);
                // gui.add(data, 'humidity').name('%温度');
                gui.add(data, 'humiMaxSize').name('湿度 %').step(1).min(0).max(100);
                box.addUI(gui.domElement, [0, box.size[1], 0 ],[0.2,1]);
                gui.setZIndex(100);
                box.uiDom = gui;
            }
        }else{
            for(var i = 0; i < boxs.length; i++){
                boxs[i].uiDom.destroy();
                boxs[i].removeUI();
                boxs[i].uiDom = null;
            }
        }
    });
    
    var smokeMarks = [];
    img2.onChange(function ( bool ) {
        panelCtrl( bool, smokeMarks, docu.smoke, docu.smokeEle);
    });
    img3.onChange(function ( bool ) {
        if( bool ){
            docu.pipes.forEach(function (t) { t[0].visible = true })
        }else{
            docu.pipes.forEach(function (t) { t[0].visible = false })
        }
    });
    var cameraMarks = [];
    img4.onChange(function ( bool ) {
        panelCtrl( bool, cameraMarks, docu.cameras, docu.cameraEle);
    })
    img7.onChange(function ( bool ) {
        if(bool){
            docu.versions.forEach(function (obj) { obj.visible = true;})
        }else{
            docu.versions.forEach(function (obj) { obj.visible = false})
        }
       
    })
}

function panelCtrl(bool, panelArray, objs, ele) {
    if( bool ){
        if(panelArray.length == 0){
            objs.forEach(function (obj) {
                var icon = ele.cloneNode(true);
                panelArray.push(icon);
                icon.style.display = "block";
                icon.style.zIndex = 100;
                document.getElementById("div3d").insertBefore(icon, ele);
                obj.addUI(icon, [0, obj.size[1], 0 ],[0.2,1]);
            })
        }else{
            panelArray.forEach(function (obj) {obj.style.display = "block";})
        }
    }else{panelArray.forEach(function (obj) {obj.style.display = "none";})}
}

function add_versions(position,rotation) {
    // 创建立方体
    var p;
    var geometry = new THREE.CylinderGeometry( 0, 2, 6, 4 );
    var meshMaterial = new THREE.MeshBasicMaterial({ color: 0x87cefa,transparent:true,opacity:0.4 });
    meshMaterial.side = THREE.DoubleSide;
    var wireFrameMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    wireFrameMat.wireframe = true;
    var mesh = new THREE.SceneUtils.createMultiMaterialObject(geometry, [meshMaterial, wireFrameMat]);
    // 改变旋转中心点
    var wrapper = new THREE.Object3D();
    wrapper.position.set(0,2.5,0);
    wrapper.add(mesh);
    mesh.position.set(-0,-2.5,-0);
    p = wrapper;
    // 设置pos rot
    p.position.set(position[0],position[1],position[2]);
    p.rotation.set(rotation[0],rotation[1],rotation[2]);
    docu.versions.push(p);
}
