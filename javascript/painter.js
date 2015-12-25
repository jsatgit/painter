$(document).ready(function() {
  var $canvas = $('.canvas');
  $canvas.svg();
  var svg = $canvas.svg('get');
  var isMouseDown = false;
  var points = [];
  var path = svg.createPath();
  var strokeWidth = 5;
  var brushColor = 'red';

  changeCursor(brushColor, strokeWidth);
  $('.brush-colorpicker').colorpicker({color: brushColor}).on('changeColor.colorpicker', function(event){
      brushColor = event.color.toHex();
      changeCursor(brushColor, strokeWidth);
  });

  var brushSizeSlider = $(".brush-slider").slider({
    min: 1,
    max: 100,
    value: 5
  }).on('change', function(event) {
    strokeWidth = event.value.newValue;
    changeCursor(brushColor, strokeWidth);
  });

  var isInModalToggle = false;

  $('#settings').on('hide.bs.modal', function (e) {
    $('.brush-colorpicker').colorpicker('hide');
    isInModalToggle = true;
  });

  $('#settings').on('hidden.bs.modal', function() {
    isInModalToggle = false;
  });

  $('#settings').on('show.bs.modal', function() {
    isInModalToggle = true;
  });

  $('#settings').on('shown.bs.modal', function() {
    isInModalToggle = false;
  });

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
    stack = [];
  }

  var stack = [];
  var STACK_LIMIT = 20;

  function pushPaintStack(stroke) {
    stack.push(stroke);
    if (stack.length > STACK_LIMIT) {
      stack.shift();
    }
  }

  function popPaintStack() {
    return stack.pop();
  }

  function undo() {
    var last = $('.canvas svg').children().last();
    pushPaintStack(last);
    last.remove();
  }

  function redo() {
    var lastStroke = popPaintStack();
    if (lastStroke) {
      $('.canvas svg').append(lastStroke);
    }
  }

  function settings() {
    if (!isInModalToggle) {
      $('#settings').modal('toggle');
    }
  }

  var keyToAction = {
    'c': clear,
    'u': undo,
    'r': redo,
    's': settings
  }

  function onDragStart(x, y) {
    points = [[x, y]];
    svg.circle(x, y, strokeWidth/2, {fill: brushColor});
  }

  function onDragMove(x, y) {
    if (points.length < 4) {
      points.push([x, y]);
    } else {
      var mid = [(points[2][0] + x) / 2, (points[2][1] + y) / 2]
      var properties = {
          stroke: brushColor,
          strokeWidth: strokeWidth,
          fill:'transparent'
      };
      properties['stroke-linecap'] = 'round';
      path.reset();
      svg.path(path.move(points[0][0], points[0][1])
                   .curveC(points[1][0], points[1][1],
                           points[2][0], points[2][1],
                           mid[0], mid[1])
                   , properties);
      points = [mid, [x, y]];
    }
  }

  function changeCursor(color, width) {
    var strokeRadius = width / 2;
    var cursor = document.createElement('canvas');
    var ctx = cursor.getContext('2d');

    cursor.width = width;
    cursor.height = width;

    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(strokeRadius, strokeRadius, strokeRadius, 0, Math.PI*2, true);
    ctx.fillStyle = color
    ctx.fill();
    ctx.translate(-strokeRadius, -strokeRadius);

    $canvas.css('cursor', 'url(' + cursor.toDataURL() + ') ' + strokeRadius + ' ' + strokeRadius + ' ,auto');
  }
});
