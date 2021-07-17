function debugMess(mes) {
    if (debug == false) return;
    if (typeof mes == 'object' ) {
      mes = JSON.stringify(mes);
    }
    $("#debug").append("<br/><hr/><br/>");
    $("#debug").append(mes + "<br />");
}
//if (console.everything === undefined)
//{
    //console.everything = [];

    console.defaultLog = console.log.bind(console);
    console.log = function(){
        debugMess({"type":"log", "datetime":Date().toLocaleString(), "value":Array.from(arguments)}); 
        //console.everything.push({"type":"log", "datetime":Date().toLocaleString(), "value":Array.from(arguments)});
        console.defaultLog.apply(console, arguments);
    }
    console.defaultError = console.error.bind(console);
    console.error = function(){
        debugMess({"type":"error", "datetime":Date().toLocaleString(), "value":Array.from(arguments)}); 
        //console.everything.push({"type":"error", "datetime":Date().toLocaleString(), "value":Array.from(arguments)});
        console.defaultError.apply(console, arguments);
    }
    console.defaultWarn = console.warn.bind(console);
    console.warn = function(){
        debugMess({"type":"warn", "datetime":Date().toLocaleString(), "value":Array.from(arguments)}); 
        //console.everything.push({"type":"warn", "datetime":Date().toLocaleString(), "value":Array.from(arguments)});
        console.defaultWarn.apply(console, arguments);
    }
    console.defaultDebug = console.debug.bind(console);
    console.debug = function(){
        debugMess({"type":"debug", "datetime":Date().toLocaleString(), "value":Array.from(arguments)}); 
        //console.everything.push({"type":"debug", "datetime":Date().toLocaleString(), "value":Array.from(arguments)});
        console.defaultDebug.apply(console, arguments);
    }
//}
function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    var items = location.search.substr(1).split("&");
    for (var index = 0; index < items.length; index++) {
        tmp = items[index].split("=");
        if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
    }
    return result;
}
