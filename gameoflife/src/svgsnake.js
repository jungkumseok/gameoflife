//Dependencies: jQuery

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
function randint(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
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
function bindSnakeGame(elem, options){
	if (!elem.snakegame){
		function GameController(){
			var self = this;
			
			function Snake(){
				var snake = this;
				snake.direction = 'up'
				snake.data = [[10, 9], [10, 10], [10, 11], [10, 12]];
				snake.get_next_cell = function(){
					if (snake.direction === 'up') return [snake.data[0][0], snake.data[0][1] - 1];
					else if (snake.direction === 'right') return [snake.data[0][0] + 1, snake.data[0][1]];
					else if (snake.direction === 'down') return [snake.data[0][0], snake.data[0][1] + 1];
					else if (snake.direction === 'left') return [snake.data[0][0] - 1, snake.data[0][1]];
				}
				snake.is_intersecting = function(coords){
					for (var i=0; i < snake.data.length; i++){
						if (coords[0] === snake.data[i][0] && coords[1] === snake.data[i][1]) return true;
					}
					return false;
				}
				snake.set_direction = function(direction){
					if ( (direction === 'up' && snake.direction !== 'down')
					     || (direction === 'right' && snake.direction !== 'left')
						 || (direction === 'down' && snake.direction !== 'up')
						 || (direction === 'left' && snake.direction !== 'right') ) snake.direction = direction;
				};
				
				snake.next_state = function(){
					var next_cell = snake.get_next_cell();
					if (self.cells[next_cell[0]] && self.cells[next_cell[0]][next_cell[1]] === false){
						if (!snake.is_intersecting(next_cell)){
							snake.data.unshift(next_cell);
							snake.data.pop();
						}
						else{
							throw "GameOver";
						}
					}
					else if ( (self.food[0] === next_cell[0])  && (self.food[1] === next_cell[1])){
						//Snake eats food
						snake.data.unshift(next_cell);
						self.food = new_food();
						self.score += next_reward;
			  			next_reward = Math.abs(self.food[0] - self.snake.data[0][0]) + Math.abs(self.food[1] - self.snake.data[0][1]) + 50;
					}
					else {
						throw "GameOver";
					}
				}
				snake.unapply_state = function(){
					for (var i=0; i < snake.data.length; i++){
		  				self.cells[snake.data[i][0]][snake.data[i][1]] = false;
		  			}
				}
				snake.apply_state = function(){
					for (var i=0; i < snake.data.length; i++){
		  				self.cells[snake.data[i][0]][snake.data[i][1]] = true;
		  			}
				}
				snake.move = function(){
					snake.unapply_state();
					snake.next_state();
					snake.apply_state();
				}
			}
			
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
						stroke: '#ddd',
						strokeWidth: 1,
						cursor: 'pointer'
					})
		  			box.onmouseover = function(){
		  				$(box).attr({ fill : 'orange', stroke: '#ddd', strokeWidth : 1});
		  			};
		  			box.onmouseout = function(){
		  				if (self.cells[x][y] === true) $(box).attr({ fill: 'red', stroke: '#444', strokeWidth : 1});
		  				else $(box).attr({ fill: 'white', stroke: '#ddd', strokeWidth: 1 })
		  			};
		  			box.onclick = function(){
		  				self.cells[x][y] = !self.cells[x][y];
		  			};
	  			return box
	  		}
			
			//controls
			var label_iteration = domelem('span'); $(label_iteration).text('0');
			var label_score = domelem('span'); $(label_score).text('Score: 0');
			var label_next_reward = domelem('span'); $(label_next_reward).text(next_reward);
			var btn_next = domelem('button'); $(btn_next).html("<i class='fa fa-step-forward'></i> Next");
			var btn_stop = domelem('button'); $(btn_stop).html("<i class='fa fa-stop'></i> Stop");
			var btn_play = domelem('button'); $(btn_play).html("<i class='fa fa-play'></i> Play");
			var btn_randomize = domelem('button'); $(btn_randomize).html("<i class='fa fa-random'></i> Randomize");
			var btn_clear = domelem('button'); $(btn_clear).html("<i class='fa fa-eraser'></i> Clear");
			var btn_reset = domelem('button'); $(btn_reset).html("<i class='fa fa-eraser'></i> Reset");
			
			//SVG instance
			self.view = svgelem('svg');
				$(self.view).attr({ width: 600, height: 600 });
			
			self.iterationCount = 0;
			self.score = 0;
	  		self.frame_player = null;
	  		
	  		self.fps = 10;
	  		self.interval = 1000 / self.fps;
	  		
	  		self.cellSize = 25;
	  		self.maxWidth = 600;
	  		self.maxHeight = 600;
	  		self.x_count = Math.ceil(self.maxWidth / self.cellSize);
	  		self.y_count = Math.ceil(self.maxHeight / self.cellSize);
	  		
	  		self.cells = emptyGrid(self.x_count, self.y_count, false);
	  		self.svg_cells = emptyGrid(self.x_count, self.y_count, boxFactory); //this should be called only after cells is defined.
	  		
	  		self.gameState = 'new';
	  		
	  		self.snake = new Snake();
	  		self.food = null;
	  		var next_reward = 50;
	  		
	  		//Critical Functions
	  		
	  		function next_state(){
	  			//clear_state();
	  			self.snake.move();
	  			//draw food
	  			self.cells[self.food[0]][self.food[1]] = true;
	  			
	  			self.iterationCount ++;
	  			if (next_reward > 0) next_reward --;
	  			$(label_iteration).text(self.iterationCount);
	  			$(label_score).text('Score: '+self.score);
	  			$(label_next_reward).text(next_reward);
	  		}
	  	
	  		function render_state(){
	  		//render state by flipping colors of the cells
	  			for (var x = 0 ; x < self.x_count ; x++){
	  				for (var y = 0; y < self.y_count ; y++){
	  					if (self.cells[x][y] === true) $(self.svg_cells[x][y]).attr({ fill: 'red', stroke: '#444', strokeWidth: 1 });
	  					else $(self.svg_cells[x][y]).attr({ fill: 'white', stroke: '#ddd', strokeWidth: 1 });
	  				}
	  			}
	  			$(self.svg_cells[self.food[0]][self.food[1]]).attr({ fill: 'blue', stroke: '#444', strokeWidth: 1 });
	  		}
	  		
	  		//State Functions
	  		function clear_state(){
	  			for (var x = 0; x < self.x_count ; x++){
	  				for (var y = 0; y < self.y_count; y ++){
	  					self.cells[x][y] = false;
	  				}
	  			}
	  		}
	  		
	  		function new_food(){
	  			var randxy = [randint(0, self.x_count), randint(0, self.y_count)];
	  			while (self.cells[randxy[0]][randxy[1]] === true || self.snake.is_intersecting(randxy)){
	  				randxy = [randint(0, self.x_count), randint(0, self.y_count)];
	  			}
	  			return randxy;
	  		}
	  		
	  		function new_game_state(){
	  			self.snake = new Snake();
	  			self.food = new_food();
	  			clear_state();
	  			for (var i=0; i < self.snake.data.length; i++){
	  				self.cells[self.snake.data[i][0]][self.snake.data[i][1]] = true;
	  			}
	  			//draw food
	  			self.cells[self.food[0]][self.food[1]] = true;
	  			self.gameState = 'new'
	  			self.score = 0;
	  			next_reward = 50;
	  		}
	  		
	  		//Control functions
	  		function restart(){
	  			new_game_state();
	  			render_state();
	  			$(dialog_message).text('Start New Game\n(Press Enter)');
	  			$(label_score).text('Score: '+self.score);
	  		}
	  		
	  		function next(){
	  			try {
	  				next_state();
		  			render_state();	
	  			}
	  			catch(e){
	  				stop();
	  				if (e == 'GameOver'){
	  					$(dialog_div).show();
	  					$(dialog_message).text("GAME OVER\n(Press Enter)");
	  					self.gameState = 'gameover'
	  				}
	  				console.log(e);
	  			}
	  		}
	  		
	  		function play(){
	  			if (!self.frame_player){
	  				self.frame_player = setInterval(function(){
		  				next();
		  			}, self.interval)	
	  			}
	  			self.gameState = 'play';
	  			$(dialog_div).hide();
	  		}
	  		function stop(){
	  			clearInterval(self.frame_player);
	  			self.frame_player = null;
	  			self.gameState = 'stop';
	  			$(dialog_div).show();
	  			$(dialog_message).text("Game PAUSED\n(Space to resume)");
	  		}
	  		function toggle_pause(){
	  			if (self.gameState === 'play') stop();
	  			else if (self.gameState === 'stop') play();
	  		}
	  		
	  		$(btn_next).on('click', function(){
	  			next();
	  		});
	  		
	  		$(btn_play).on('click', function(){
	  			play();
	  		});
	  		
	  		$(btn_stop).on('click', function(){
	  			stop();
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
	  			$(label_score).text('Score: '+self.score);
	  			$(label_next_reward).text(next_reward);
	  			
	  			clear_state();
	  			render_state();
	  		});
	  		
	  		//containers
	  		var main_div = domelem('div');
	  		var		dialog_div = domelem('div'); $(dialog_div).css({ width: '300px',
	  																height: '300px',
	  																background: 'rgba(240, 240, 240, 0.75)',
	  																border: '1px solid #888',
	  																position:'absolute',
	  																top: '150px',
	  																left:'150px',
	  																textAlign: 'center' });
	  		var			dialog_inst = domelem('span', dialog_div); $(dialog_inst).text('Enter : Start'
	  																					+'\nSpace : Pause'
	  																					+'\nArrow Keys : Direction'
	  																					+'\n\n(Click on cells to make obstacles)'
	  																					);
	  					$(dialog_inst).css({
	  						display: 'block',
	  						fontSize: '1.4em',
	  						whiteSpace: 'pre-wrap',
	  						marginTop: '32px',
	  					});
	  		var			dialog_message = domelem('span', dialog_div); $(dialog_message).text('Start New Game\n(Press Enter)');
	  					$(dialog_message).css({
	  						display: 'block',
	  						fontSize: '1.8em',
	  						fontWeight: '600',
	  						whiteSpace: 'pre-wrap',
	  						marginTop: '30px'
	  					});
	  		var		dialog_score = domelem('div'); $(dialog_score).css({ width: '100px',
																		height: '25px',
																		background: 'none',
																		position:'absolute',
																		top: '575px',
																		left:'500px',
																		textAlign: 'right',
																		fontSize: '18px',
																		color: '#444'});
	  				$(dialog_score).append(label_score);
	  		
			$(main_div).append(self.view);
			$(main_div).append(dialog_div);
			$(main_div).append(dialog_score);
			$(elem).html(main_div);
//			$(elem).append(label_iteration);
//			$(elem).append(label_next_reward);
//			$(elem).append(btn_next);
//			$(elem).append(btn_stop);
//			$(elem).append(btn_play);
			
			$(elem).attr({ tabindex: '1' });
			
			$(document).bind('keydown', function(e){
				switch (e.keyCode){
				case 13:
					if (self.gameState === 'new'){
						play();
					}
					else if (self.gameState === 'gameover'){
						restart();
					}
					break;
				case 32:
					toggle_pause();
					break;
				case 37:
					self.snake.set_direction('left');
					break;
				case 38:
					self.snake.set_direction('up');
					break;
				case 39:
					self.snake.set_direction('right');
					break;
				case 40:
					self.snake.set_direction('down');
					break;
				}
			})
			$(document).ready(function(){
				$(elem).focus();
			});
			
			//Initialize

			restart();
			//play();
		}
		
		elem.snakegame = new GameController();
	}
	else {
		throw elem + " is already bound to snake-game"
	}
}

//Method 2 - jQuery plugin
(function ( $ ) { 
    $.fn.SnakeGame = function(options) {        
        return this.each(function(){
        	bindSnakeGame(this, options);
        });
    };
 
}( jQuery ));

//Method 3 - Initialization using method 2   Opt in

$(document).ready(function(){
	$("snake-game, .snake-game").SnakeGame();
});
