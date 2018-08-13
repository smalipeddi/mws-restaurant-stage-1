/*eslint-env node */
/* eslint-env node */
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "watch" }]*/
var gulp = require("gulp");
var browserSync = require("browser-sync").create();
var sass = require("gulp-sass");
var autoprefixer = require("gulp-autoprefixer");
var eslint = require("gulp-eslint");
var jasmine = require("gulp-phantom-jasmine");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify-es").default;
var gutil = require("gulp-util");
var babel = require("gulp-babel");
var sourcemaps = require('gulp-sourcemaps');

gulp.task("default",["styles","copy-html","copy-images","lint"], function(cb){
  gulp.watch("sass/**/*.scss" , ["styles"]);
  gulp.watch("js/**/*.js" , ["lint"]);
  gulp.watch("index.html" , ["copy-html"]);
  gulp.watch("img/*" , ["copy-images"]);
  gulp.watch('./dist/index.html').on('change' ,browserSync.reload());
  browserSync.init({
    server: "./dist"
  });
  cb();
});

gulp.task("scripts", () => {
  gulp.src(["js/**/*.js"])
  .pipe(babel())
  .pipe(gulp.dest("./dist/js"));


});

gulp.task("scripts-dist", () => {
  gulp.src("js/**/*.js")
  .pipe(sourcemaps.init())
  .pipe(babel())
  .pipe(concat("all.js"))
  .pipe(uglify("all.js"))
  .pipe(sourcemaps.write())
  .pipe(gulp.dest("./dist/js"));
});

gulp.task("styles", function(cb){
  gulp.src("sass/**/*.scss")
    .pipe(sass({outputStyle : "compressed"}).on("error", sass.logError))
    .pipe(autoprefixer({
      browsers :["last 2 versions"]
    }))
    .pipe(gulp.dest("./dist/css"))
    .pipe(browserSync.stream());
  cb();
});

gulp.task("tests", function(){
  gulp.src("tests/spec/extra.js").
    pipe(jasmine({
      integration: true,
      vendor: "js/**/*.js"
    }));
});


gulp.task("lint", () => {
  return gulp.src(["js/**/*.js"])
  // eslint() attaches the lint output to the "eslint" property
  // of the file object so it can be used by other modules.
    .pipe(eslint())
  // eslint.format() outputs the lint results to the console.
  // Alternatively use eslint.formatEach() (see Docs).
    .pipe(eslint.format())
  // To have the process exit with an error code (1) on
  // lint error, return the stream and pipe to failAfterError last.
    .pipe(eslint.failOnError());
});

// gulp.task('default', gulp.series(['styles' ,'lint']), function(cb){
// 	gulp.watch('sass/**/*.scss',['styles']);
//     gulp.watch('js/**/*.js',['lint']);
//     gulp.watch('build/index.html').on('change' ,browserSync.reload);
    
// 	cb();
// });

gulp.task("copy-html", () => {
  gulp.src("./index.html")
    .pipe(gulp.dest("./dist"));
  gulp.src("./restaurant.html")
    .pipe(gulp.dest("./dist"));
});

gulp.task("copy-images", () => {
  gulp.src("./img/*")
    .pipe(gulp.dest("./dist/img"));
  gulp.src("./images/*")
    .pipe(gulp.dest("./dist/images"));
    
});



// Static Server + watching scss/html files
gulp.task("serve", ["styles"], function(cb) {
  browserSync.init({
    server: "./"
  });
  gulp.watch("./scss/*.scss", ["styles"]);
  // gulp.watch("js/*.js", ['js-watch']);
  gulp.watch("./*.html").on("change", browserSync.reload);
  cb();
});

gulp.task('dist' ,['copy-html' ,'copy-images' ,'lint' ,'styles' ,'scripts-dist']);



//var 'browser-sync' = require('browser-sync');
// function defaultTask(cb) {
//   // place code for your default task here
//   cb();
//   console.log("hello gulp");
// }

//exports.default = defaultTask


// // process JS files and return the stream.
// gulp.task('js', function () {
//     return gulp.src('js/*js')
//         .pipe(uglify())
//         .pipe(gulp.dest('dist/js'));
// });

// // create a task that ensures the `js` task is complete before
// // reloading browsers
// gulp.task('js-watch', ['js'], function (done) {
//     browserSync.reload();
//     done();
// });


// // or...

// gulp.task('browser-sync', function() {
//     browserSync.init({
//         proxy: "yourlocal.dev"
//     });
//     cb();
// });