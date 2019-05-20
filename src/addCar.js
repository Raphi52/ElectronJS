const {ipcRenderer} = require('electron');
const {dialog} = require('electron').remote;

let imgPath = undefined;

// Add listener when the form for add new car is submit
$("#addCar").on('submit', function (e) {
    e.preventDefault();

    // Serialize the data of the form
    const newCar = $("#addCar").serializeArray().reduce(function (obj, item) {
        obj[item.name] = item.value;
        return obj;
    }, {});

    // Add the path of the img if exist
    newCar.imgPath = imgPath;

    // Then send it to the main process for some manipulation
    ipcRenderer.send('newCar', newCar);

    this.reset();
});

// Add event listener when click on the upload button
$("#selectImg").on('click', function () {
    dialog.showOpenDialog(function (fileNames) {
        if (fileNames !== undefined) {
            $("#selectedImg").val(fileNames[0]);
            imgPath = fileNames[0];
        }
    });
});