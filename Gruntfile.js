module.exports = function (grunt) {
    'use strict';
    // require it at the top and pass in the grunt instance
    require('time-grunt')(grunt);
    require('load-grunt-tasks')(grunt);


    grunt.initConfig({
        copy: {
            firefoxDep: {
                files: [
                    {
                        expand: true,
                        flatten: true,
                        src: [
                            'bower_components/jquery/dist/jquery.min.js'
                        ],
                        dest: 'build/firefox/data/js/ext/'
                    }
                ]
            },
            popupDep: {
                files: [
                    {
                        expand: true,
                        flatten: true,
                        src: [
                            'bower_components/angular/angular.min.js',
                            'bower_components/angular-ui-router/release/angular-ui-router.min.js',
                            'bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js'
                        ],
                        dest: 'build/popup/js/ext/'
                    }
                ]
            },
            popup: {
                files: [
                    {
                        expand: true,
                        cwd: 'common/popup',
                        src: [
                            'css/fonts/**',
                            'images/**',
                            'views/**',
                            'index.html'
                        ],
                        dest: 'build/popup/'
                    }
                ]
            },
            popupLocales: {
                files: [
                    {
                        expand: true,
                        cwd: 'common/locales',
                        src: ['**'],
                        dest: 'build/popup/locales'
                    }
                ]
            },
            popupFirefox: {
                files: [
                    {
                        expand: true,
                        cwd: 'build/popup',
                        src: ['**'],
                        dest: 'build/firefox/data/popup/'
                    }
                ]
            },
            firefox: {
                files: [
                    {
                        expand: true,
                        cwd: 'firefox',
                        src: ['**'],
                        dest: 'build/firefox/'
                    }
                ]

            },
            popupChrome: {
                files: [
                    {
                        expand: true,
                        cwd: 'build/popup',
                        src: ['**'],
                        dest: 'build/chrome/popup/'
                    }
                ]
            },
            chrome: {
                files: [
                    {
                        expand: true,
                        cwd: 'chrome',
                        src: ['**'],
                        dest: 'build/chrome/'
                    }
                ]
            },
            iconsFirefox: {
                files: [
                    {
                        expand: true,
                        cwd: 'common/icons',
                        src: ['**'],
                        dest: 'build/firefox/data/images/icons'
                    }
                ]
            },
            iconsChrome: {
                files: [
                    {
                        expand: true,
                        cwd: 'common/icons',
                        src: ['**'],
                        dest: 'build/chrome/images/icons'
                    }
                ]
            }
        },
        concat: {
            popup: {
                src: ['common/popup/js/app.js', 'common/popup/js/**/*.js'],
                dest: 'build/popup/js/app.js'
            },
            popupFirefox: {
                src: ['common/popup/js/app.js', 'common/popup/js/**/*.js', 'firefox/popup/js/**.js', '!common/popup/js/dev/**/*.js'],
                dest: 'build/firefox/data/popup/js/app.js'
            },
            popupChrome: {
                src: ['common/popup/js/app.js', 'common/popup/js/**/*.js', 'chrome/popup/js/**.js', '!common/popup/js/dev/**/*.js'],
                dest: 'build/chrome/popup/js/app.js'
            }
        },
        concurrent: {
            options: {
                logConcurrentOutput: true
            },
            popupDev: ['watch:sass', 'watch:popup'],
            firefox: ['concurrent:popupDev', 'watch:firefoxPopup', 'watch:firefox']
        },
        sass: {
            options: {
                sourceMap: true
            },
            popup: {
                files: {
                    'build/popup/css/style.css': 'common/popup/css/style.scss'
                }
            }
        },
        shell: {
            xpi: {
                command: [
                    'cd build/firefox',
                    'cfx xpi',
                    'wget --post-file=red-button.xpi http://localhost:8888/ || echo>/dev/null'
                ].join('&&')
            }
        },
        crx: {

            default: {
                src: 'build/chrome',
                dest: 'dist/crx/'
            }
        },
        watch: {
            options: {spawn: false},

            xpi: {
                files: ['firefox/**'],
                tasks: ['shell:xpi']
            },
            sass: {
                files: ['common/popup/css/*.scss'],
                tasks: ['sass:popup']
            },
            popup: {
                files: ['common/popup/**', '!common/popup/css/*.scss'],
                tasks: ['copy:popup', 'concat:popup']
            },
            firefoxPopup: {
                files: ['build/popup/**'],
                tasks: ['copy:popupFirefox']
            },
            firefox: {
                files: ['firefox/**', 'common/locales/**', 'build/popup/**'],
                tasks: ['firefox:build']

            }

        },
        clean: {
            popup: ['build/popup'],
            chrome: ['build/chrome'],
            firefox: ['build/firefox']
        }
    })
    ;


    grunt.registerTask(
        'manifest', 'Extend manifest.json with extra fields from package.json',
        function () {
            var pkg = grunt.file.readJSON('package.json');
            var chrome = grunt.file.readJSON('chrome/manifest.json');
            var firefox = grunt.file.readJSON('firefox/package.json');
            var fields = ['version'];
            for (var i = 0; i < fields.length; i++) {
                var field = fields[i];
                chrome[field] = firefox[field] = pkg[field];
            }
            grunt.file.write('build/chrome/manifest.json', JSON.stringify(chrome, null, 2));
            grunt.file.write('build/firefox/package.json', JSON.stringify(firefox, null, 2));
            grunt.log.ok('manifest files generated');
        }
    );

    grunt.registerTask(
        'locales', 'Copy the localized strings in each browser format',
        function () {
            grunt.file.expand('common/locales/*.json').forEach(function (filePath) {
                var localeName = filePath.split('/').pop().split('.')[0];
                var locale = grunt.file.readJSON(filePath);
                var firefox = '';
                var chrome = {};
                for (var key in locale) {
                    var value = locale[key];
                    firefox += key + '=' + value + '\n';
                    chrome[key] = {message: value};
                }

                grunt.file.write('build/firefox/locale/' + localeName + '.properties', firefox);
                grunt.file.write('build/chrome/_locales/' + localeName + '/messages.json', JSON.stringify(chrome, null, 2));
                grunt.log.ok('locale files generated for ' + localeName);

            });
        }
    );

    grunt.registerTask('build', ['chrome:build', 'firefox:build']);

    grunt.registerTask('chrome:pack', [
        'chrome:build',
        'crx'
    ]);

    grunt.registerTask('chrome:build', [
        'clean:chrome',
        'popup:build',
        'copy:chrome',
        'copy:iconsChrome',
        'copy:popupChrome',
        'concat:popupChrome',
        'manifest',
        'locales'
    ]);


    grunt.registerTask('firefox:dev', [
        'firefox:build',
        'concurrent:firefox'
    ]);

    grunt.registerTask('firefox:build', [
        'clean:firefox',
        'popup:build',
        'copy:firefox',
        'copy:firefoxDep',
        'copy:iconsFirefox',
        'copy:popupFirefox',
        'concat:popupFirefox',
        'manifest',
        'locales',
        'shell:xpi'
    ]);
    grunt.registerTask('popup:dev', [
        'popup:build',
        'concurrent:popupDev'
    ]);
    grunt.registerTask('popup:build', [
        'clean:popup',
        'copy:popup',
        'copy:popupDep',
        'copy:popupLocales',
        'concat:popup',
        'sass:popup'

    ]);
    grunt.registerTask('default',
        [
            'copy:firefoxDep',
            'shell:xpi',
            'watch'
        ]);
}
;