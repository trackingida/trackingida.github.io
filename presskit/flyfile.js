const assign = require("object-assign")

var x = module.exports;
var paths = {
    config: { src: 'src/config/*'
            , dist: 'dist'
            }
  , pug: { src: 'src/*.jade'
         , watch: 'src/**.jade'
         , dist: 'dist'
         }
  , css: { src: 'src/stylesheets/*.css'
         , dist: 'dist/stylesheets'
         }
  , sass: { src: 'src/stylesheets/*.scss'
          , includes: 'src/stylesheets/sass'
          , dist: 'dist/stylesheets'
          }
  , images: { src: 'src/images/**'
            , dist: 'dist/images'
            }
  , favicons: { src: 'src/favicons/**'
              , dist: 'dist'
              }
  , js: { src: 'src/scripts/*.js'
        , dist: 'dist/js'
        }
};

function registerFilters (m) {

  var marked = require('jstransformer-marked');
  var rend = marked.render;
  marked.render = function (str) {
    return rend(str, {
      gfm: true,
      tables: true,
      breaks: false,
      pedantic: false,
      sanitize: true,
      smartLists: true,
      smartypants: true
    })
  };

  var fs = require('fs');
  var fileSize = function (relativePath) {
    return fs.statSync(__dirname+"/dist"+relativePath).size;
  }

  m.filter("pug", function (data, options) {
    return { data: require("pug").render(data.toString()
                                        , { filters: [marked]
                                          , fileSize: fileSize
                                          , filename: options.filename })
           , ext: ".html"
           };
  });



  // m.filter("cname", function (data, options) {
  //   return {
  //     data: "tetheron.com"
  //   }
  // });

  var postcss = require("postcss");
  m.filter("postcss", function (data, config) {
        // Combine our config with defaults using Object.assign
        config = assign({}, {plugins: [], options: {}}, config)

        // Return our promise out so we can wrap this async promise-based API
        return new Promise(function (resolve, reject) {
            // Pull in the plugins list
            postcss(config.plugins)
                // Process the CSS with PostCSS and our options object passed to PostCSS
                .process(data.toString(), config.options)
                .then(function (result) {
                    // Resolve our CSS the way Fly expects it
                    return resolve({css: result.css})
                })
                .catch(function (err) {
                    self.emit("plugin_error", {
                      plugin: "fly-postcss",
                      error: err
                    })
                })
        })
    })


}

x.default = function * () {
  registerFilters(this);
  // yield this.start('styles', 'scripts')
  yield this.start('pug');
}

x.watch = function * () {
  registerFilters(this);
  yield this.watch(paths.config.src, 'config');
  yield this.watch(paths.css.src, 'css');
  yield this.watch(paths.sass.src, 'sass');
  yield this.watch(paths.images.src, 'images');
  yield this.watch(paths.favicons.src, 'favicons');
  yield this.watch(paths.pug.watch, 'pug');
 // yield this.watch("app/lib/**/*.js", ["js", "lint"], {parallel: true});
}


x.pug = function * () {
  yield this
    .source(paths.pug.src)
    .pug()
    .target(paths.pug.dist);
}

x.css = function * () {
  yield this
    .source(paths.css.src)
    .postcss({
      plugins: [
        // require('precss'),
        require('autoprefixer')
      ],
      // options: {
      //   // parser: require('postcss-scss'),
      //   // from: 'a.css',
      //   // to: 'a.out.css'
      // }
    })
    .target(paths.css.dist);
}

x.images = function * () {
  yield this
    .source(paths.images.src)
    .target(paths.images.dist);
}

x.config = function * () {
  yield this
    .source(paths.config.src)
    .target(paths.config.dist);
}

x.favicons = function * () {
  yield this
    .source(paths.favicons.src)
    .target(paths.favicons.dist);
}

x.sass = function * () {
  yield this
    .source(paths.sass.src)
    .sass({ outputStyle: 'compressed',
            includePaths: [paths.sass.includes, 'node_modules/normalize-scss/sass'],
            sourceMap: true,
          })
    .postcss({
      plugins: [
        // require('precss'),
        require('autoprefixer')
      ],
      // options: {
      //   // parser: require('postcss-scss'),
      //   // from: 'a.css',
      //   // to: 'a.out.css'
      // }
    })
    .target(paths.sass.dist)
}


// x.styles = function * () {
//   yield this.source(paths.css.src)
//     // ...
//     .concat('main.css')
//     .target(paths.css.dist)
// }

// x.scripts = function * () {
//   yield this.source(paths.js.src)
//     .eslint()
//     // ...
//     .concat('main.js')
//     .target(paths.js.dist)
// }