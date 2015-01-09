// Setup requestAnimationFrame and cancelAnimationFrame for use in the game code
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = 
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());


$(window).load(function() {
    game.init();
});

//before the loader can be used, we need to call the loader.init() method from inside game.init()
//son the loade loader is initialized when the game is getting initialized.

var game = {
    init: function(){
        levels.init();
        loader.init();

        // Hide all game layers and display the start screen
        $('.gamelayer').hide();
        $('#gamestartscreen').show();
        //Get handler for game canvas and context
        game.canvas = $('#gamecanvas')[0];
        game.context = game.canvas.getContext('2d');
    },
    showLevelScreen:function(){
        $('.gamelayer').hide();
        $('#levelselectscreen').show('slow');
    },
    // use the game.start() method to set up the animation loop, and then we draw the level inside the
    // game.animate() method. 
    mode:"intro",
    slingshotX:140,
    slingshotY:280,
    // the start() method: Hides all other layers and displays the canvas layer and the score layer that is 
    // a narrow bar on the top of the screen that contains.
    // Sets the game animation interval to call the animate() function by using window.requestAnimationFrame.
    start: function(){
        $('.gamelayer').hide();
        $('#gamecanvas').show();
        $('#scorescreen').show();
        // mode will be used to store the current state of the game (intro, wait for firing, firing, fired).
        game.mode = "intro";
        game.offsetLeft = 0;
        game.ended = false;
        game.animationFrame = window.requestAnimationFrame(game.animate, game.canvas);
    },
    handlePanning: function(){
        game.offsetLeft++; // Temporary placeholder
    },
    // animate(), will do all the animation and drawing within our game. 
    animate: function(){
        game.handlePanning();
        // draw the background and foreground image using the offsetLeft variable to offset the x axis of the images. 
        game.context.drawImage(game.currentLevel.backgroundImage,game.offsetLeft/4,0,640,480,0,0,640,480);
        game.context.drawImage(game.currentLevel.foregroundImage,game.offsetLeft,0,640,480,0,0,640,480);
        game.context.drawImage(game.slingshotFrontImage,game.slingshotX-game.offset,game.slingshotY);
        // we check if the game.ended flag has been set and, if not, use requestAnimationFrame to call animate() again.
        if(!game.ended){
            game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);
        }
    }
}



var levels = {
    data:[
        {
            foreground:'desert-foreground',
            background:'clouds-background',
            entities:[]
        },
        {
            foreground:'desert-foreground',
            background:'clouds-background',
            entities:[]
        }
    ],
    init:function(){
        var html="";
        for(var i = 0; i < levels.data.length; i++) {
            var level = levels.data[i];
            html += '<input type="button" value="'+(i+1)+'">';
        };
        $('#levelselectscreen').html(html);

        $('#levelselectscreen input').click(function(){
            levels.load(this.value-1);
            $('#levelselectscreen').hide();
        });
    },

    // The load() function creates a currentLevel object to store the loaded level data.
    // So far we have only loaded three images. We will eventually use this method to load the heroes, 
    // villains, and blocks needed to build the game.
    // One last thing to note is that we call the game.start() method once the images are loaded by either
    // calling it immediately or setting an onload callback. This start() method is where the actual game will 
    // be drawn.

    load:function(number){

        game.currentLevel = { number: number, hero:[]};
        game.score = 0;
        $('#score').html('Score: ' + game.score);
        var level = levels.data[number];
        //load the background, foreground, and slingshot images
        game.currentLevel.backgroundImage = loader.loadImage("images/backgrounds/" + level.background + ".png");
        game.currentLevel.foregroundImage = loader.loadImage("images/backgrounds/" + level.foreground + ".png");
        game.slingshotImage = loader.loadImage("images/slingshot.png");
        game.slingshotFrontImage = loader.loadImage("images/slingshot-front.png");

        if(loader.loaded){
            game.start()
        } else {
            loader.onload = game.start;
        }
    }
}

var loader = {
    loaded:true,
    loadedCount:0, //Assets that ave been loaded so far
    totalCount:0,   //Total number of assets that need to be loaded

    //An init() method that detects the supported audio file format and saves it.
    init:function(){

        var mp3Support,oggSupport;
        var audio = document.createElement('audio');
        if (audio.canPlayType) {
            mp3Support = "" != audio.canPlayType('audio/mpeg');
            oggSupport= "" != audio.canPlayType('audio/ogg;  codecs="vorbis');
        } else {
            mp3Support=false;
            mp3Support=false;
        }
        // Check for ogg, then mp3, and finally set soundFileExtn to undefined
        loader.soundFileExtn = oggSupport?".ogg":mp3Support?".mp3":undefined;  

    },
    // Two methods for loading images and audio files—loadImage() and loadSound(). Both
    // methods increment the totalCount variable and show the loading screen when invoked.
    loadImage:function(url){
        this.totalCount++;
        this.loaded=false;
        $('#loadingscreen').show();
        var image = new Image();
        image.src = url;
        image.onload = loader.itemLoaded;
        return image;
    },
    soundFileExtn:".ogg",
    loadSound:function(url){
        this.totalCount++;
        this.loaded=false;
        $('#loadingscreen').show();
        var audio = new Audio();
        audio.src = url + loader.soundFileExtn;
        audio.addEventListener("canplaythrough", loader.itemLoaded, false);
        return audio;
    },
    // An itemLoaded() method that is invoked each time an asset finishes loading. 
    // This method updates the loaded count and the loading message. Once all the assets are loaded,
    // the loading screen is hidden and an optional loader.onload() method is called (if defined). 
    // This lets us assign a callback function to call once the images are loaded.
    // 
    // Using a callback method makes it easy for us to wait while the images are loading and start the game 
    // once all images have loaded

    itemLoaded:function(){
        loader.loadedCount++;
        $('#loadingmessage').html('Loaded ' + loader.loadedCount + ' of ' + loader.totalCount);
        if (loader.loadedCount === loader.totalCount){
            loader.loaded = true;
            $('#loadingscreen').hide();
            if(loader.onload){
                loader.onload();
                loader.onload=undefined;
            }
        }
    }
}