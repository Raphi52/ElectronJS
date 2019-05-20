const path = require('path');
const {app, BrowserWindow, ipcMain, Menu, Notification, nativeImage} = require('electron');
const Store = require('electron-store');
const store = new Store();
const fs = require('fs');

// Create some data, for the moment they are not persisted
let cars = [];
let win = null;
let newCarWin = null;
let editionMode = false;

// Function for create the new car window
function createNewCarWindow() {
    if (newCarWin) {
        return;
    }

    newCarWin = new BrowserWindow({width: 450, height: 400});
    newCarWin.loadFile(path.join('src', 'addCar.html'));

    // Listen when the window will be closed for destroy it
    newCarWin.on('closed', () => {
        newCarWin = null
    })
}

function showDesktopNotification(title, body, imgPath, textButton) {
    const successNotification = new Notification({
        title: title,
        body: body,
        icon: nativeImage.createFromPath(imgPath),
        closeButtonText: textButton
    });

    successNotification.show();
}

// Create the window when the app is ready
app.on('ready', function createWindow() {
    win = new BrowserWindow({width: 800, height: 600});

    win.loadFile(path.join('src', 'index.html'));

    // Listen when the window is finished to load
    win.webContents.on('did-finish-load', function () {

        if (store.has('cars')) {
            cars = store.get('cars');
        }

        // Send the cars with the showCars event
        win.webContents.send('showCars', cars);

    });
});

// Show a new window for add a new car
ipcMain.on('showNewCarWindow', function (e, arg) {
    createNewCarWindow();
});

// Listen for new car event
ipcMain.on('newCar', function (e, newCar) {
    // Set the id of the car
    let newId = 1;
    if (cars.length > 0) {
        newId = cars[cars.length - 1].id + 1;
    }

    newCar.id = newId;

    // Retrieve the img if exist and set it in the app directory
    fs.readFile(newCar.imgPath, function (err, data) {
        if (err) {
            // Show desktop notification
            showDesktopNotification('Échec lors de l\'ajout.', 'La voiture n\'a pas été ajoutée !', path.join(__dirname, '/src/contents/img/delete.png'), 'Fermer');
            throw err;
        }

        fs.writeFile(path.join(__dirname, '/src/contents/carsImg/' + newCar.id + '.png'), data, function (err) {
            if (err) {
                // Show desktop notification
                showDesktopNotification('Échec lors de l\'ajout.', 'La voiture n\'a pas été ajoutée !', path.join(__dirname, '/src/contents/img/delete.png'), 'Fermer');
                throw err;
            }

            // Then update the new path
            newCar.imgPath = path.join(__dirname, '/src/contents/carsImg/' + newCar.id + '.png');

            // Add the new car to the array
            cars.push(newCar);

            // Update the file with the new array of cars
            store.set('cars', cars);

            // We have to use the main window event, not the event sender that is the new window
            win.webContents.send('showCars', [newCar]);

            // Show desktop notification
            showDesktopNotification('Ajout réussi.', 'La voiture a été ajoutée avec succès !', path.join(__dirname, '/src/contents/img/checked.png'), 'Fermer');

            // Try to close the add car page
            newCarWin.close();
        })
    });

});

// Listen for delete car event
ipcMain.on('deleteCar', function (e, carId) {

    // Delete the car from the array
    for (let i = 0; i < cars.length; i++) {
        if (cars[i].id === carId) {
            cars.splice(i, 1);
            break;
        }
    }

    // Delete the img for the app
    fs.unlink(path.join(__dirname, '/src/contents/carsImg/' + carId + '.png'), function (err) {
        if (err) {
            // Show desktop notification
            showDesktopNotification('Échec lors de la suppression.', 'La voiture n\'a pas été supprimée !', path.join(__dirname, '/src/contents/img/delete.png'), 'Fermer');
            throw err;
        }

        // Update the file with the new array of cars
        store.set('cars', cars);

        // Show desktop notification
        showDesktopNotification('Suppression réussie.', 'La voiture a été supprimée avec succès !', path.join(__dirname, '/src/contents/img/delete.png'), 'Fermer');

        // Send back a confirmation that the car is correctly deleted
        e.sender.send('carDeleted', carId);
    });

});

//////// CONFIG MENU /////////
const template = [
    {
        label: 'Action',
        submenu: [
            {
                label: 'Nouvelle voiture',
                accelerator: 'CommandOrControl+N',
                click: createNewCarWindow
            },
            {
                label: 'Activer/Désactiver mode édition',
                accelerator: 'CommandOrControl+E',
                click() {
                    let bodyNotif = "Désactivation du mode édition";
                    if (!editionMode) {
                        bodyNotif = "Activation du mode édition";
                    }
                    editionMode = !editionMode;

                    // Show desktop notification
                    showDesktopNotification('Mode édition.', bodyNotif, path.join(__dirname, '/src/contents/img/pencil.png'), 'Fermer');

                    win.webContents.send('toggleEditionMode');
                }
            },
            {
                label: 'Exporter au format CSV',
                accelerator: 'CommandOrControl+T',
                click() {
                    const ObjectsToCsv = require('objects-to-csv');

                    // Save to file:
                    let csv = new ObjectsToCsv(cars);
                    csv.toDisk(path.join(__dirname, '/cars.csv'), {append: true});

                    // Show desktop notification
                    showDesktopNotification('Exportation réussie.', 'Vos données ont bien été exportées.', path.join(__dirname, '/src/contents/img/checked.png'), 'Fermer');

                }
            }
        ]
    },
    {
        label: 'Fenêtre',
        submenu: [
            {role: 'reload'},
            {role: 'toggledevtools'},
            {type: 'separator'},
            {role: 'togglefullscreen'},
            {role: 'minimize'},
            {type: 'separator'},
            {role: 'close'}
        ]
    },
];

if (process.platform === 'darwin') {
    template.unshift({
        label: app.getName(),
        submenu: [
            {role: 'quit'}
        ]
    });
}

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);