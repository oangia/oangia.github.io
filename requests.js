function getData() {
  alert("in get data");
  try {
  info();
  bctc();
  } catch (err) {
    console.log(err);
  }
}
function info() {
  alert("ìni");
  $.ajax({
    url: api_url + '/api/info.php?code=' + code,
    method: 'GET',
    success: function(data) {
      info = data;
      alert(infi);
      if (debug) {
        console.log(info);
      }
    },
    error: function(response, status, error) {
      console.log(response);
      console.log(status);
      console.log(error);
    }
  });    
}
function bctc() {
  alert("bc");
  $.ajax({
    url: api_url + "/api/bctc.php?code=" + code + "&type=BCTT&page=1",
    method: 'GET',
    success: function (data) {
      formatData(data[1]);
      charts();
      if (debug) {
        var name = "";
        $.each(data[1], function(value, index) {
          name += value+ "<br/>";
        });
        console.log(name);
      }
    }
  })
}
function formatData(data) {
  $.each(data, function (name, value) {
    dataPoints[name] = [];
    $.each(data[name].Value, function(year, value) {
      dataPoints[name].push({x: new Date(year, 0, 1), y: value});
    });
  }); 
  var growths = ["Net revenue"];
  $.each(growths, function(index, name) {
    dataPoints[name + " growth"] = [];
    $.each(dataPoints[name], function(index, value) {
      var per = 0;
      if (index >= 1) {
       per = (value.y - dataPoints[name][index - 1].y)*100/dataPoints[name][index - 1].y;
      }
      dataPoints[name + " growth"].push({x: value.x, y: parseFloat(per.toFixed(2)) });
    });
  });

  dataPoints["General and Administrative expenses on gross profit"] = [];
  dataPoints["Selling expenses on gross profit"] = [];
  dataPoints["Financial expenses on gross profit"] = [];
  $.each(dataPoints["Gross profit"], function(index, value) {
    var gae = parseFloat((dataPoints["General and Administrative expenses"][index].y*100/value.y).toFixed(2));
    var se = parseFloat((dataPoints["Selling expenses"][index].y*100/value.y).toFixed(2));
    var fe = parseFloat((dataPoints["Financial expenses"][index].y*100/value.y).toFixed(2));
    dataPoints["General and Administrative expenses on gross profit"].push({x: value.x, y: gae});
    dataPoints["Selling expenses on gross profit"].push({x: value.x, y: se});
    dataPoints["Financial expenses on gross profit"].push({x: value.x, y: fe});
  });
  if (debug) {
    console.log(dataPoints);
  }
}
