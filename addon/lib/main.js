var buttons = require('sdk/ui/button/toggle');
var panels = require("sdk/panel");
var self = require("sdk/self");
var _ = require("sdk/l10n").get;

var screenshots = require("./screenshot");


var button = buttons.ToggleButton({
    id: "red-button",
    label: _("product_name"),
    icon: {
        "16": "./images/icon-16.png",
        "32": "./images/icon-32.png"
        //"64": "./images/icon-64.png" TODO: Add icon-64
    },
    onChange: handleChange
});

var panel;

function handleChange(state) {
    if (state.checked) {

        var imageDataUri = screenshots.captureTab();
        //tabs.open(imageDataUri);

        const panelWidth = 300;
        panel = panels.Panel({
            contentURL: self.data.url("panel.html"),
            contentScriptFile: [self.data.url("js/jquery-2.1.3.min.js"), self.data.url("js/panel.js")],
            width: panelWidth,
            height: 400,
            onHide: handleHide
        });

        panel.show({
            position: button
        });
        panel.port.emit('init', {
            screenshot: imageDataUri,
            strings: {
                comment_field_placeholder: _('comment_field_placeholder'),
                passcode_placeholder: _('passcode_placeholder'),
                close_button: _('close_button'),
                sending: _('sending'),
                send_button: _('send_button')
            }
        });
        panel.port.on('close', function () {
            handleHide();
        });
        panel.port.on('heightChanged', function (height) {
            console.log(height);
            panel.resize(panelWidth, height + 20);
        });

    }
}

function handleHide() {
    button.state('window', {checked: false});
    panel.destroy();
}