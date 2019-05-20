const {ipcRenderer} = require('electron');
const {dialog, Menu, MenuItem} = require('electron').remote;

// Function for generate a row in the table
function generateRowTable(car) {

    // Retrieve the body of the table
    const tbody = $('tbody');

    // Create the complete row
    const tr = $('<tr id="rowCar_' + car.id + '">');
    tr.append('<th scope="row">' + car.id + '</th>');
    tr.append('<td>' + car.brandName + '</td>');
    tr.append('<td>' + car.modelName + '</td>');
    tr.append('<td><button id="deleteCar_' + car.id + '" class="btn-danger" style="display: none">Supprimer</button></td>');

    // Append it to the table
    tbody.append(tr);

    // Create the listener for the delete button
    const deleteBtn = $('#deleteCar_' + car.id);
    deleteBtn.on('click', function (e) {
        e.preventDefault();

        // First show a dialog in order to be sure the user really want to delete the car
        dialog.showMessageBox({
            type: 'warning',
            buttons: ['Non', 'Oui'],
            title: 'Confirmation',
            message: 'Êtes-vous sûr de vouloir supprimer cette voiture ?'
        }, function (res) {
            if (res === 1) {
                // Send the id of the car for delete it
                ipcRenderer.send('deleteCar', car.id);
            }
        });

    })
}

// Function for toggle edition mode
function toggleEditionMode() {
    // Just show or hide the column action
    if(!$("#actionColumn").is(':visible') && !$("[id^=deleteCar_]").is(':visible')) {
        $("#actionColumn").show();
        $("[id^=deleteCar_]").show();
    }
    else {
        $("#actionColumn").hide();
        $("[id^=deleteCar_]").hide();
    }
}

// Listen for the showCars event
ipcRenderer.on('showCars', function (e, cars) {
    // Loop through each car in the array send
    cars.forEach(generateRowTable);
});

// Listen for the deletedCar event
ipcRenderer.on('carDeleted', function (e, carId) {
    // Delete the row of the car from the UI
    $("#rowCar_" + carId).remove();
});

// Listen for the toggleEditionMode event
ipcRenderer.on('toggleEditionMode', function (e, arg) {
    toggleEditionMode();
});

// Wait for the dome to be ready
$(function () {
    // Create the context menu
    const menu = new Menu();
    menu.append(new MenuItem({
        label: 'Nouvelle voiture', click() {
            // Send message for open the new window
            ipcRenderer.send('showNewCarWindow');
        }
    }));
    menu.append(new MenuItem({
        label: 'Activer/Désactiver menu édition', click() {
            toggleEditionMode();
        }
    }));

    // Add event listener for show the new menu when user make a right click
    $(document).on('contextmenu', function (e) {
        e.preventDefault();
        const {remote} = require('electron');
        menu.popup({window: remote.getCurrentWindow()});
    });
});