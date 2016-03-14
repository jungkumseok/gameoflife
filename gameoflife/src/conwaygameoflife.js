//Dependencies: jQuery, Bootstrap, Fontawesome

//shortcuts
function domelem(tag, parent){
	var elem = document.createElement(tag);
	if (parent) parent.appendChild(elem);
	return elem;
}
function svgelem(tag, parent){
	var elem = document.createElementNS('http://www.w3.org/2000/svg', tag);
	if (parent) parent.appendChild(elem);
	return elem;
}

//helper for generating x * y array
//  in order to be able to use the array in format = array[x][y],
//  the data is stored with the axes flipped:  eg.  [ 1  2  3 ]   stored as  [[1, 4, 7],
//													[ 4  5  6 ]      ->       [2, 5, 8],
//													[ 7  8  9 ]               [3, 6, 9]]
function emptyGrid(x_count, y_count, fill){
	var cells = [];
	for (var x = 0 ; x < x_count ; x++){
		var cols = [];
		for (var y = 0 ; y < y_count ; y++){
			if (typeof fill === 'function'){
				cols.push( fill( x, y ) )
			}
			else {
				cols.push(fill);	
			}
		}
		cells.push(cols);
	}
	return cells;
}

//GameOfLife Components
//This method is overloaded
function GOLComponent(name, arg1, arg2){
	var self = this;
	if (typeof name === 'string'){
		self.name = name;
		//if arg1 = x * y array
		if (arg1 && !arg2 && arg1 instanceof Array && arg1.length > 0){
			self.width = arg1.length;
			self.height = arg1[0].length;
			self.data = arg1;
		}
		//if arg1 = width, arg2 = height
		else if (arg1 && arg2 && typeof arg1 === 'number' && typeof arg2 === 'number'){
			self.width = arg1;
			self.height = arg2;
			self.data = emptyGrid(self.width, self.height, false);
		}
		else {
			throw "You must provide either ( x * y 2d array ) or ( width, height ) to create a component";
		}
	}
}

var GOL_COMPONENT_BLINKER_H = new GOLComponent('Blinker - Horizontal', [[true],
                                                                        [true],
                                                                        [true]]);
var GOL_COMPONENT_BLINKER_V = new GOLComponent('Blinker - Vertical', [[true, true, true]]);

var GOL_COMPONENT_GLIDER_SM = new GOLComponent('Glider - Small', [[false, false, true],
                                                                  [true, false, true],
                                                                  [false,  true,  true]]);


//Below are GameOfLife Functions
//3 modes of execution
//   1) use the function bindGameOfLife(DOMElement, options)
//        this is the raw method that method 2 and 3 relies on.
//        this function can be invoked on the raw DOM reference.
//	   2) use the jQuery function $(DOMSelector).GameOfLife();
//        this method can be used when the DOM element is loaded after document load (e.g. via ajax)
//
//	   3) use className 'game-of-life' or use tag <game-of-life><game-of-life> in the input element
//        this method can be used in DOM elements loaded with the document (in the main HTML)
//
//Method 1 - Base function   //input should be native DOM input, options should be a Json object containing key:val pairs
function bindGameOfLife(elem, options){
	if (!elem.gameoflife){
		function ConwayController(){
			var self = this;
			
			//helper: svg rectangle generator
			function boxFactory(x, y){
	  			//this should be called only after self.cells[][] is defined.
				var box = svgelem('rect', self.view);
					$(box).attr({
						x: x * self.cellSize,
						y: y * self.cellSize,
						width: self.cellSize,
						height: self.cellSize,
						fill: (self.cells[x][y] ? 'red' : 'white'),
						stroke: 'black',
						strokeWidth: 1,
						cursor: 'pointer'
					})
		  			box.onmouseover = function(){
		  				$(box).attr({ fill : 'orange', stroke: 'black', strokeWidth : 1});
		  			};
		  			box.onmouseout = function(){
		  				if (self.cells[x][y] === true) $(box).attr({ fill: 'red', stroke: 'black', strokeWidth : 1});
		  				else $(box).attr({ fill: 'white', stroke: 'black', strokeWidth: 1 })
		  			};
		  			box.onclick = function(){
		  				self.cells[x][y] = !self.cells[x][y];
		  			};
	  			return box
	  		}
			
			//controls
			var label_iteration = domelem('span'); $(label_iteration).text('0');
			var input_fps = domelem('input'); input_fps.type = 'number'; input_fps.min = '0.25'; input_fps.max='30'; input_fps.step='0.25';
				input_fps.value = 15;
			var input_cellsize = domelem('input'); input_cellsize.type = 'number'; input_cellsize.min = '15'; input_cellsize.max='100';
				input_cellsize.value = 25;
				
			var btn_next = domelem('button'); $(btn_next).html("<i class='fa fa-step-forward'></i> Next");
			var btn_stop = domelem('button'); $(btn_stop).html("<i class='fa fa-stop'></i> Stop");
			var btn_play = domelem('button'); $(btn_play).html("<i class='fa fa-play'></i> Play");
			var btn_randomize = domelem('button'); $(btn_randomize).html("<i class='fa fa-random'></i> Randomize");
			var btn_clear = domelem('button'); $(btn_clear).html("<i class='fa fa-eraser'></i> Clear");
			var btn_reset = domelem('button'); $(btn_reset).html("<i class='fa fa-eraser'></i> Reset");
			
			var select_preset = domelem('select');
				var preset_option_none = domelem('option', select_preset); $(preset_option_none).html('--- None ---');
					preset_option_none.value = 'None';
				var preset_option_glider = domelem('option', select_preset); $(preset_option_glider).html('Gliders');
					preset_option_glider.value = 'Gliders';
			
			var select_component = domelem('select');
			var btn_select_component = domelem('button'); $(btn_select_component).html("<i class='fa fa-check'></i> Use");
			
			//SVG instance
			self.view = svgelem('svg');
				$(self.view).attr({ width: 1000, height: 400 });
			
			self.iterationCount = 0;
	  		self.frame_player = null;
	  		
	  		self.fps = 15;
	  		self.interval = 1000 / self.fps;
	  		
	  		self.cellSize = 25;
	  		self.maxWidth = 1000;
	  		self.maxHeight = 400;
	  		self.x_count = Math.ceil(self.maxWidth / self.cellSize);
	  		self.y_count = Math.ceil(self.maxHeight / self.cellSize);
	  		
	  		self.cells = emptyGrid(self.x_count, self.y_count, false);
	  		self.svg_cells = emptyGrid(self.x_count, self.y_count, boxFactory); //this should be called only after cells is defined.
	  		
	  		self.available_components = [];
			
	  		//extra data functions (non-critical to Game of Life functionality)
			//    eg. component loader
			function load_available_components(){
				//call this function just once
				self.available_components = [ GOL_COMPONENT_BLINKER_H,
				                              GOL_COMPONENT_BLINKER_V,
				                              GOL_COMPONENT_GLIDER_SM ];
				for (var i=0; i < self.available_components.length; i++){
					$(select_component).append('<option value="'+i+'">'+self.available_components[i].name+'</option>');
				}
			}
	  		
	  		//Critical Functions
	  		function count_state(){
	  		//scan through cells and counts how many neighbors each cell has
	  			var ncells = emptyGrid(self.x_count, self.y_count, 0);
	  			var rx, ry;
	  			for (var x = 0 ; x < self.x_count ; x++){
	  				for (var y = 0; y < self.y_count ; y++){
	  					if (self.cells[x][y] === true){
	  						for (var xx = x - 1; xx <= x + 1; xx++){
	  							for (var yy = y - 1; yy <= y + 1; yy++){
	  								rx = (xx < 0) ? (self.x_count + xx) : ( (xx >= self.x_count) ? 0 : xx );
	  			  					ry = (yy < 0) ? (self.y_count + yy) : ( (yy >= self.y_count) ? 0 : yy );
	  			  					if (!(xx == x && yy == y)) ncells[rx][ry] ++;
	  							}
	  						}
	  					}
	  				}
	  			}
	  			return ncells;
	  		}
	  		
	  		function next_state(){
	  		//apply game of life evolution rules and overwrites current state
	  			var ncells = count_state()
	  			for (var x = 0; x < self.x_count ; x++){
	  				for (var y = 0; y < self.y_count; y ++){
	  					if (self.cells[x][y] === true && (ncells[x][y] < 2 || ncells[x][y] > 3 )) ncells[x][y] = false;
	  					else if (ncells[x][y] === 3 && self.cells[x][y] === false) ncells[x][y] = true;
	  					else ncells[x][y] = self.cells[x][y];
	  				}
	  			}
	  			self.cells = ncells;
	  			self.iterationCount ++;
	  			$(label_iteration).text(self.iterationCount);
	  		}
	  	
	  		function render_state(){
	  		//render state by flipping colors of the cells
	  			for (var x = 0 ; x < self.x_count ; x++){
	  				for (var y = 0; y < self.y_count ; y++){
	  					if (self.cells[x][y] === true) $(self.svg_cells[x][y]).attr({ fill: 'red', stroke: 'black', strokeWidth: 1 });
	  					else $(self.svg_cells[x][y]).attr({ fill: 'white', stroke: 'black', strokeWidth: 1 });
	  				}
	  			}
	  		}
	  		
	  		//State functions
	  		function random_state(){
	  			for (var x = 0; x < self.x_count ; x++){
	  				for (var y = 0; y < self.y_count; y ++){
	  					self.cells[x][y] = (Math.random() > 0.5) ? true : false;
	  				}
	  			}
	  		}
	  		function clear_state(){
	  			for (var x = 0; x < self.x_count ; x++){
	  				for (var y = 0; y < self.y_count; y ++){
	  					self.cells[x][y] = false;
	  				}
	  			}
	  		}
	  		
	  		function load_preset(preset_name){
	  			if (preset_name === 'Gliders') preset_state_glider();
	  		}
	  		
	  		//presets
	  		function preset_state_glider(){
	  			for (var x = 0; x < self.x_count ; x++){
	  				for (var y = 0; y < self.y_count; y ++){
	  					if (x % 5 === 1 &&  y % 5 === 0 && y < 15) self.cells[x][y] = true;
	  					else if (x % 5 === 2 &&  y % 5 === 1 ) self.cells[x][y] = true;
	  					else if ((x % 5 === 0 || x % 5 === 1 || x % 5 === 2) && y % 5 === 2) self.cells[x][y] = true;
	  					else self.cells[x][y] = false;
	  				}
	  			}
	  		}
	  		
	  		//component placement
	  		function place_component(component_index, x, y){
	  			var component = self.available_components[component_index];
	  			console.log(component);
	  			var rx, ry;
	  			for (var sx = x; sx < x + component.width; sx ++){
	  				for (var sy = y; sy < y + component.height; sy ++){
	  					rx = (sx < 0) ? ((self.x_count + sx) % self.x_count) : ( (sx >= self.x_count) ? ((sx - self.x_count) % self.x_count) : sx );
		  				ry = (sy < 0) ? ((self.y_count + sy) % self.x_count) : ( (sy >= self.y_count) ? ((sy - self.y_count) % self.x_count) : sy );
		  				console.log(rx+', '+ry)
	  					self.cells[rx][ry] = component.data[sx-x][sy-y];
	  				}
	  			}
	  		}
	  		
	  		//Control functions
	  		function next(){
	  			next_state();
	  			render_state();
	  		}
	  		
	  		function play(){
	  			if (!self.frame_player){
	  				self.frame_player = setInterval(function(){
		  				next();
		  			}, self.interval)	
	  			}
	  		}
	  		function stop(){
	  			clearInterval(self.frame_player);
	  			self.frame_player = null;
	  		}
	  		
	  		$(btn_next).on('click', function(){
	  			next();
	  		});
	  		
	  		$(btn_play).on('click', function(){
	  			play();
	  			input_fps.disabled = true;
	  			input_cellsize.disabled = true;
	  		});
	  		
	  		$(btn_stop).on('click', function(){
	  			stop();
	  			input_fps.disabled = false;
	  			input_cellsize.disabled = false;
	  		});
	  		
	  		$(btn_randomize).on('click', function(){
	  			random_state();
	  			render_state();
	  		});
	  		
	  		$(btn_clear).on('click', function(){
	  			clear_state();
	  			render_state();
	  		});
	  		
	  		$(btn_reset).on('click', function(){
	  			self.iterationCount = 0;
	  			$(label_iteration).text(self.iterationCount);
	  			clear_state();
	  			$(input_fps).val(15);
	  			$(input_cellsize).val(25);
	  			$(input_fps).change();
	  			$(input_cellsize).change();
	  			render_state();
	  		});
	  		
	  		$(select_preset).on('change', function(){
	  			load_preset( $(this).val() );
	  			render_state();
	  		});
	  		
	  		$(btn_select_component).on('click', function(){
	  			place_component( $(select_component).val() , 40, 16 );
	  			render_state();
	  		});
	  		
	  		$(input_fps).on('change', function(){
	  			if ($(this).val()){
	  				self.fps = $(this).val();
	  	  			self.interval = 1000 / self.fps;
	  			};
	  		});
	  		$(input_cellsize).on('change', function(){
	  			if ($(this).val()){
	  				$(self.view).empty();
	  				
	  		  		self.cellSize = $(this).val();
	  		  		self.maxWidth = 1000;
	  		  		self.maxHeight = 500;
	  		  		self.x_count = Math.ceil(self.maxWidth / self.cellSize);
	  		  		self.y_count = Math.ceil(self.maxHeight / self.cellSize);
	  		  		
	  		  		self.cells = emptyGrid(self.x_count, self.y_count, false);
	  		  		self.svg_cells = emptyGrid(self.x_count, self.y_count, boxFactory); //this should be called only after cells is defined.
	  				
	  			};
	  		});
			
			//containers
			var main_div = domelem('div');
			var		panel_heading = domelem('div', main_div);
						$(panel_heading).html("Conway's Game of Life <a href='https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life' target='_blank'><i class='fa fa-info-circle'></i></a>")
			var		panel_body = domelem('div', main_div);
			var			body_row = domelem('div', panel_body);
			var				body_col1 = domelem('div', body_row);
			var					ctrl_g1 = domelem('span', body_col1);
			var						label_g1 = domelem('label', ctrl_g1); $(label_g1).text("Iteration");
			var					ctrl_g2 = domelem('span', body_col1);
			var						label_g2 = domelem('label', ctrl_g2); $(label_g2).text("Frames Per Second (FPS)");
			var					ctrl_g3 = domelem('span', body_col1);
			var						label_g3 = domelem('label', ctrl_g3); $(label_g3).text("Cell Size (px) / Zoom");
			var					btn_g1 = domelem('span', body_col1);
			var					btn_g2 = domelem('span', body_col1);
			var					ctrl_g4 = domelem('span', body_col1);
			var						label_g4 = domelem('label', ctrl_g4); $(label_g4).text("Preset");
			var					ctrl_g5 = domelem('span', body_col1);
			var						label_g5 = domelem('label', ctrl_g5); $(label_g5).text("Component");
			var				body_col2 = domelem('div', body_row);
			
			//attaching controllers
			ctrl_g1.appendChild(label_iteration);
			ctrl_g2.appendChild(input_fps);
			ctrl_g3.appendChild(input_cellsize);
			
			ctrl_g1.appendChild(btn_next);
			btn_g1.appendChild(btn_stop);
			btn_g1.appendChild(btn_play);
			
			btn_g2.appendChild(btn_randomize);
			btn_g2.appendChild(btn_clear);
			btn_g2.appendChild(btn_reset);
			
			ctrl_g4.appendChild(select_preset);
			ctrl_g5.appendChild(select_component);
			ctrl_g5.appendChild(btn_select_component);
			
			body_col2.appendChild(self.view);
			
			//Bootstrap classes
			main_div.className = 'panel panel-default';
				panel_heading.className = 'panel-heading';
				panel_body.className = 'panel-body';
					body_row.className = 'row';
						body_col1.className = 'col-sm-2';
							ctrl_g1.className = 'form-group';
							ctrl_g2.className = 'form-group';
							ctrl_g3.className = 'form-group';
							btn_g1.className = 'btn-group';
							btn_g2.className = 'btn-group';
						body_col2.className = 'col-sm-10 text-center';
			
				label_iteration.className = 'label label-default';
				input_fps.className = 'form-control';
				input_cellsize.className = 'form-control';
				btn_next.className = 'btn btn-primary pull-right';
				btn_stop.className = 'btn btn-primary';
				btn_play.className = 'btn btn-primary';
				btn_randomize.className = 'btn btn-danger';
				btn_clear.className = 'btn btn-danger';
				btn_reset.className = 'btn btn-danger';
				select_preset.className = 'form-control';
				select_component.className = 'form-control';
				btn_select_component.className = 'btn btn-success';

			$(elem).html(main_div);
			
			//Initialize

	  		//random_state();
	  		render_state();
	  		load_available_components();
		}
		
		elem.gameoflife = new ConwayController();
	}
	else {
		throw elem + " is already bound to game-of-life"
	}
}

//Method 2 - jQuery plugin
(function ( $ ) { 
    $.fn.GameOfLife = function(options) {        
        return this.each(function(){
        	bindGameOfLife(this, options);
        });
    };
 
}( jQuery ));

//Method 3 - Initialization using method 2   Opt in

$(document).ready(function(){
	$("game-of-life, .game-of-life").GameOfLife();
});
