function prepareData(data) {
  var chartData = [];
  $.each(data, function(index, value) {
    chartData.push(convertData (value[0], value[1], value[2]));
  });
  return chartData;
}

function convertData(type, color, name) {
  return {        
    type: type,  
		 showInLegend: true, 
	  	color: color,
		 legendMarkerColor: color,
		 legendText: name,
		 indexLabel: "{y}",
		 dataPoints: dataPoints[name]
	 };
}

function generateChart(id, title, data, options = {}) {
(new CanvasJS.Chart(id, {
	animationEnabled: true,
	zoomEnabled: true,
	theme: "dark2",
	title:{
		text: title
	},
	dataPointWidth: 30,
	axisX: {
   interval: 1,
   intervalType: "year"
  },
	axisY: {
		title: "",
		minimum: 0,
		gridThickness: 1
	},
	data: data
})).render();
}
