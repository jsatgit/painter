var SettingsModel = function SettingsModel() {
  this.listeners = {};
  this.backgroundColor = '#353839';
  this.brushColor = 'red';
  this.brushSize = 5;
  this.erasing = false;
};

$.extend(SettingsModel.prototype, {
  addListener: function(eventName, callback) {
    this.listeners[eventName] = this.listeners[eventName] || [];
    this.listeners[eventName].push(callback);
  },

  notify: function(eventName) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach(function(callback) {
        callback();
      })
    }
  },

  getBackgroundColor: function() {
    return this.backgroundColor;
  },

  setBackgroundColor: function(color) {
    this.backgroundColor = color;
    this.notify('backgroundcolorchange');
  },

  getBrushColor: function() {
    return this.brushColor;
  },

  setBrushColor: function(color) {
    this.brushColor = color;
    this.notify('brushcolorchange');
  },

  getBrushSize: function() {
    return this.brushSize;
  },

  setBrushSize: function(size) {
    this.brushSize = size;
    this.notify('brushsizechange');
  },

  isErasing: function() {
    return this.erasing;
  },

  setErasing: function(isErasing) {
    this.erasing = isErasing;
    if (isErasing) {
      this.notify('erasebegin');
    } else {
      this.notify('eraseend');
    }
  }
});

var CanvasModel = function CanvasModel() {
  this.listeners = {};
  this.undoStack = [];
  this.UNDO_STACK_LIMIT = 20;
};

$.extend(CanvasModel.prototype, {
  addListener: function(eventName, callback) {
    this.listeners[eventName] = this.listeners[eventName] || [];
    this.listeners[eventName].push(callback);
  },

  notify: function(eventName) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach(function(callback) {
        callback();
      })
    }
  },

  undo: function() {
    this.notify('canvasundo');
  },

  redo: function() {
    this.notify('canvasredo');
  },

  clear: function() {
    this.notify('canvasclear');
  },

  pushUndoStack: function(stroke) {
    this.undoStack.push(stroke);
    if (this.undoStack.length > this.UNDO_STACK_LIMIT) {
      this.undoStack.shift();
    }
  },

  popUndoStack: function() {
    return this.undoStack.pop();
  },

  clearUndoStack: function() {
    this.undoStack = [];
  }
});

var SettingsView = function SettingsView(model) {
  this.model = model;
  this.init();
};

$.extend(SettingsView.prototype, {
  init: function() {
    var self = this;

    $('.brush-colorpicker').colorpicker({
      color: self.model.getBrushColor()
    }).on('changeColor.colorpicker', function(event){
      self.model.setBrushColor(event.color.toHex());
    });

    $('.background-colorpicker').colorpicker({
      color: self.model.getBackgroundColor()
    }).on('changeColor.colorpicker', function(event) {
      self.model.setBackgroundColor(event.color.toHex());
    });

    $('.brush-slider').slider({
      min: 1,
      max: 100,
      value: self.model.getBrushSize()
    }).on('change', function(event) {
      self.model.setBrushSize(event.value.newValue);
    });

    $('.eraser-toggle').bootstrapToggle({
      on: 'Erase',
      off: 'Paint',
      width: 70
    }).bootstrapToggle(self.model.isErasing() ? 'on' : 'off').change(function() {
      self.model.setErasing($(this).prop('checked'));
    });
  }
});

var CursorView = function CursorView(color, size) {
  this.color = color;
  this.size = size;
  this.cursor = undefined;
  this.$canvas = $('.canvas');
  this.init();
};

$.extend(CursorView.prototype, {
  render: function() {
    var radius = this.size / 2;

    this.cursor.width = this.size;
    this.cursor.height = this.size;

    var ctx = this.cursor.getContext('2d');
    ctx.beginPath();
    ctx.arc(radius, radius, radius, 0, Math.PI*2, true);
    ctx.fillStyle = this.color;
    ctx.fill();

    this.$canvas.css('cursor', 'url(' + this.cursor.toDataURL() + ') ' + radius + ' ' + radius + ' ,auto');
  },

  setColor: function(color) {
    this.color = color;
    this.render();
  },

  setSize: function(size) {
    this.size = size;
    this.render();
  },

  init: function() {
    this.cursor = document.createElement('canvas');
    this.render();
  }
});

var CanvasView = function CanvasView(canvasModel, settingsModel) {
  this.canvasModel = canvasModel;
  this.settingsModel = settingsModel;
  this.points = [];
  this.isMouseIn = false;
  this.isMouseDown = false;
  this.brushColor = this.settingsModel.getBrushColor();
  this.$canvas = undefined;
  this.svg = undefined;
  this.$svg = undefined;
  this.path = undefined;
  this.cursorView = undefined;
  this.init();
};

$.extend(CanvasView.prototype, {
  onDragStart: function(x, y) {
    this.points = [[x, y]];
    var radius = this.settingsModel.getBrushSize() / 2;
    this.svg.circle(x, y, radius, {fill: this.brushColor});
  },

  onDragMove: function(x, y) {
    if (this.points.length < 4) {
      this.points.push([x, y]);
    } else {
      var mid = [(this.points[2][0] + x) / 2, (this.points[2][1] + y) / 2];
      var pathProperties = {
        stroke: this.brushColor,
        strokeWidth: this.settingsModel.getBrushSize(),
        fill:'transparent'
      };
      pathProperties['stroke-linecap'] = 'round';
      this.path.reset();
      this.svg.path(this.path.move(this.points[0][0], this.points[0][1])
          .curveC(this.points[1][0], this.points[1][1],
            this.points[2][0], this.points[2][1],
            mid[0], mid[1]), pathProperties);
      this.points = [mid, [x, y]];
    }
  },

  setBackgroundColor: function(color) {
    this.$canvas.css('background', color);
  },

  init: function() {
    var self = this;

    this.$canvas = $('.canvas');
    this.$canvas.mouseleave(function() {
      this.isMouseIn = false;
      this.isMouseDown = false;
    }).mouseenter(function() {
      this.isMouseIn = true;
    }).mouseup(function(event) {
      this.isMouseDown = false;
    }).mousedown(function(event) {
      this.isMouseDown = true;
      self.onDragStart(event.clientX, event.clientY);
    }).mousemove(function(event) {
      if (this.isMouseIn && this.isMouseDown) {
        self.onDragMove(event.clientX, event.clientY);
      }
    }).on('touchstart', function(event) {
      event.preventDefault();
      var x = event.originalEvent.touches[0].clientX;
      var y = event.originalEvent.touches[0].clientY;
      self.onDragStart(x, y)
    }).on('touchmove', function(event) {
      event.preventDefault();
      var x = event.originalEvent.touches[0].clientX;
      var y = event.originalEvent.touches[0].clientY;
      self.onDragMove(x, y);
    }).svg();

    this.svg = this.$canvas.svg('get');
    this.$svg = $(this.svg._svg);
    this.path = this.svg.createPath();
    this.cursorView = new CursorView(self.settingsModel.getBrushColor(), 
                                     self.settingsModel.getBrushSize());

    self.canvasModel.addListener('canvasclear', function() {
      self.svg.clear();
      self.canvasModel.clearUndoStack();
    });

    self.canvasModel.addListener('canvasundo', function() {
      var last = self.$svg.children().last();
      self.canvasModel.pushUndoStack(last);
      last.remove();
    });

    self.canvasModel.addListener('canvasredo', function() {
      var lastStroke = self.canvasModel.popUndoStack();
      if (lastStroke) {
        self.$svg.append(lastStroke);
      }
    });

    self.settingsModel.addListener('brushcolorchange', function() {
      var brushColor = self.settingsModel.getBrushColor();
      self.cursorView.setColor(brushColor);
      self.brushColor = brushColor;
    });

    self.settingsModel.addListener('brushsizechange', function() {
      self.cursorView.setSize(self.settingsModel.getBrushSize());
    });

    self.settingsModel.addListener('backgroundcolorchange', function() {
      self.setBackgroundColor(self.settingsModel.getBackgroundColor());
    });

    self.settingsModel.addListener('erasebegin', function() {
      var backgroundColor = self.settingsModel.getBackgroundColor();
      self.cursorView.setColor(backgroundColor);
      self.brushColor = backgroundColor;
    });

    self.settingsModel.addListener('eraseend', function() {
      var brushColor = self.settingsModel.getBrushColor();
      self.cursorView.setColor(brushColor);
      self.brushColor = brushColor;
    });
  }
});

var SettingsModalView = function SettingsModalView() {
  this.isToggleInProgress = false;
  this.init();
};

$.extend(SettingsModalView.prototype, {
  toggle: function() {
    if (!this.isInModalToggle) {
      $('#settings').modal('toggle');
    }
  },

  init: function() {
    var self = this;

    $('#settings').on('hide.bs.modal', function (e) {
      $('.brush-colorpicker').colorpicker('hide');
      self.isToggleInProgress = true;
    });

    $('#settings').on('hidden.bs.modal', function() {
      self.isToggleInProgress = false;
    });

    $('#settings').on('show.bs.modal', function() {
      self.isToggleInProgress = true;
    });

    $('#settings').on('shown.bs.modal', function() {
      self.isToggleInProgress = false;
    });
  }
});

var App = function App() {
  this.keyToAction = {
    'c': this.clear,
    'u': this.undo,
    'r': this.redo,
    's': this.settings
  }
  this.settingsModel = new SettingsModel();
  this.canvasModel = new CanvasModel();
  this.canvasView = new CanvasView(this.canvasModel, this.settingsModel);
  this.settingsModalView = new SettingsModalView();
  this.settingsView = new SettingsView(this.settingsModel);
  this.init();
};

$.extend(App.prototype, {
  clear: function() {
    this.canvasModel.clear();
  },

  undo: function() {
    this.canvasModel.undo();
  },

  redo: function() {
    this.canvasModel.redo();
  },

  settings: function() {
    this.settingsModalView.toggle();
  },

  init: function() {
    var self = this;
    $(document).keypress(function(event) {
      var key = String.fromCharCode(event.which);
      var action = self.keyToAction[key];
      if (action) {
        action.bind(self)();
      }
    });
  }
});

$(document).ready(function() {
  var app = new App();
});
