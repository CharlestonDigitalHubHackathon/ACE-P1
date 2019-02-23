const gulp         = require('gulp');
const browserSync  = require('browser-sync').create();
const sass         = require('gulp-sass');
const headerfooter = require('gulp-headerfooter');
const del          = require('del');

// Static server
gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "./dist"
        }
    });
});


// Static Server + watching scss/html files
gulp.task('serve', ['sass', 'html', 'js', 'lib', 'images'], function() {

    browserSync.init({
        server: "./dist"
    });

    gulp.watch("app/scss/**/*.scss", ['sass']);
    gulp.watch("app/scss/**/*.js", ['js']);
    gulp.watch("app/**/*.html", ['html']);
    //gulp.watch("dist/*").on('change', browserSync.reload);
});

gulp.task('html', function () {
    gulp.src('./app/*.html')
        .pipe(headerfooter.header('./app/partials/header.html'))
        .pipe(headerfooter.footer('./app/partials/footer.html'))
        .pipe(gulp.dest('./dist/'))
        .pipe(browserSync.stream());
});

gulp.task('js', function() {
    return gulp.src("app/js/*.js")
        .pipe(gulp.dest("dist/js"))
        .pipe(browserSync.stream());
});

gulp.task('sass', function() {
    return gulp.src("app/scss/site.scss")
        .pipe(sass())
        .pipe(gulp.dest("dist/css"))
        .pipe(browserSync.stream());
});

gulp.task('images', function() {
    return gulp.src('app/images/**/*')
        .pipe(gulp.dest("dist/images"));
});

gulp.task('lib', function() {
    return gulp.src([
        'node_modules/jquery/dist/jquery.js',
        'node_modules/bootstrap-sass/assets/javascripts/bootstrap.js'
    ])
    .pipe(gulp.dest("dist/lib"));
});

gulp.task('clean', function() {
    return del("dist/*");
});

gulp.task('default', ['serve']);