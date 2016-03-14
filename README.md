# Conway's Game of Life

> The Game of Life, also known simply as Life, is a cellular automaton devised by the British mathematician John Horton Conway in 1970.
> The "game" is a zero-player game, meaning that its evolution is determined by its initial state, requiring no further input.
> One interacts with the Game of Life by creating an initial configuration and observing how it evolves or, for advanced players, by creating patterns with particular properties.
> ...[Read more in Wikipedia](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life)

Check out the demo [HERE](http://www.jungkumseok.com/box/dev/svg/gameoflife_plugin/)

## Dependencies

Insert the dependencies in the html

* jQuery, Bootstrap, Font Awesome

```html
<head>
  ...
  
  <link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
  <link href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css" rel="stylesheet" crossorigin="anonymous">
  
  <script src="https://code.jquery.com/jquery-2.2.1.min.js" crossorigin="anonymous"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js" crossorigin="anonymous"></script>
  
  ...
</head>
```


## How to use

Including this Game of Life widget is extremely simple.

### Step 1

Include the gameoflife.js in the <head> of your html document

```html

<head>
  ...
  <script src="http://src.jungkumseok.com/jks/conwaygameoflife.js"></script>
  
</head>

```

### Step 2

You can load the Game of Life using any of the following methods:

#### Method 1a (Recommended) : using <game-of-life> tag

In your html, use the <game-of-life></game-of-life> tag 

```html

<body>
	<game-of-life></game-of-life>
</body>

```

#### Method 1b : using CSS class

On your div element, use the css class 'game-of-life' 

```html

<body>
	<div class='game-of-life'></div>
</body>

```

#### Method 2 : jQuery method

In your Javascript, use the jQuery method $(element).GameOfLife()

```html

<body>
	<div id='my_container'></div>
	
	<script>
		$('#my_container').GameOfLife();
	</script>
</body>

```


#### Method 3 : pure javascript

In your Javascript, use the bindGameOfLife() method

```html

<body>
	<div id='my_container'></div>
	
	<script>
		var container = document.getElementById('my_container');
			 bindGameOfLife(container);
	</script>
</body>

```


## Future Update Plans

1. Build Dynamic Preset Loader (data storage needed - possibly firebase)
2. Build Dynamic "Component" Loader (data storage needed - possibly firebase)
3. Modify 'zoom' behavior so that it does not clear the cells
4. Add drag & select behavior for the cells