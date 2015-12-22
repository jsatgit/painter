$(document).ready(function() {
  var $canvas = $('.canvas');
  $canvas.svg();
  var svg = $canvas.svg('get');
  var isMouseDown = false;
  var points = [];
  var path = svg.createPath();
  var strokeWidth = 5;

  $canvas.mouseleave(function() {
    isMouseIn = false;
    isMouseDown = false;
  });

  $canvas.mouseenter(function() {
    isMouseIn = true;
  });

  $canvas.mouseup(function(event) {
    isMouseDown = false;
  });

  $canvas.mousedown(function(event) {
    isMouseDown = true;
    onDragStart(event.clientX, event.clientY);
  });

  $canvas.mousemove(function(event) {
    if (isMouseIn && isMouseDown) {
      onDragMove(event.clientX, event.clientY);
    }
  });

  $canvas.on('touchstart', function(event) {
    event.preventDefault();
    var x = event.originalEvent.touches[0].clientX;
    var y = event.originalEvent.touches[0].clientY;
    onDragStart(x, y)
  });

  $canvas.on('touchmove', function(event) {
    event.preventDefault();
    var x = event.originalEvent.touches[0].clientX;
    var y = event.originalEvent.touches[0].clientY;
    onDragMove(x, y);
  });

  $canvas.on('touchend', function(event) {
    event.preventDefault();
    var x = event.originalEvent.touches[0].clientX;
    var y = event.originalEvent.touches[0].clientY;
    onDragEnd(x, y);
  });

  $(document).keypress(function(event) {
    var key = String.fromCharCode(event.which);
    var action = keyToAction[key];
    if (action) {
      action();
    }
  });

  function clear() {
    svg.clear();
  }

  var stack = [];

  function undo() {
    var last = $('.canvas svg').children().last();
    stack.push(last);
    last.remove();
  }

  function redo() {
    var lastStroke = stack.pop();
    if (lastStroke) {
      $('.canvas svg').append(lastStroke);
    }
  }

  var keyToAction = {
    'c': clear,
    'u': undo,
    'r': redo
  }

  function onDragStart(x, y) {
    points = [[x, y]];
    svg.circle(x, y, strokeWidth/2, {fill: 'red'});
  }

  var properties = {
    stroke: 'red',
    strokeWidth: strokeWidth,
    fill:'transparent'
  };
  properties['stroke-linecap'] = 'round';

  function onDragMove(x, y) {
    if (points.length < 4) {
      points.push([x, y]);
    } else {
      var mid = [(points[2][0] + x) / 2, (points[2][1] + y) / 2]
      path.reset();
      svg.path(path.move(points[0][0], points[0][1])
                   .curveC(points[1][0], points[1][1],
                           points[2][0], points[2][1],
                           mid[0], mid[1])
                   , properties);
      points = [mid, [x, y]];
    }
  }
});
