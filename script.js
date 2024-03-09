var bleService = '0000ffe0-0000-1000-8000-00805f9b34fb';
var bleCharacteristic = '0000ffe1-0000-1000-8000-00805f9b34fb';
var gattCharacteristic;
var bluetoothDeviceDetected;

let Text_Area = document.getElementById("textareaNotification");

function isWebBluetoothEnabled() {
    if (!navigator.bluetooth) {
    console.log('Web Bluetooth API is not available in this browser!');
    // log('Web Bluetooth API is not available in this browser!');
    return false
    }
    return true
}
function requestBluetoothDevice() {
    if(isWebBluetoothEnabled){
logstatus('Finding...');
navigator.bluetooth.requestDevice({
    filters: [{
        services: ['0000ffe0-0000-1000-8000-00805f9b34fb'] }] 
    })         
.then(device => {
    device.addEventListener('gattserverdisconnected', onDisconnected);
    dev=device;
    logstatus("Connect to " + dev.name);
    console.log('Connecting to', dev);
    return device.gatt.connect();
})
.then(server => {
        console.log('Getting GATT Service...');
        logstatus('Getting Service...');
        return server.getPrimaryService(bleService);
    })
    .then(service => {
        console.log('Getting GATT Characteristic...');
        logstatus('Geting Characteristic...');
        return service.getCharacteristic(bleCharacteristic);
    })
    .then(characteristic => {
        logstatus(dev.name);
        document.getElementById("buttonText").innerText = "Rescan";
        checkconnected = true;
        Text_Area.value = "Press (+)/(-) to adjust the grippers to 0° position\nPress 'Next' to save and move to the next step";
        console.log("TextArea");
        gattCharacteristic = characteristic
        // gattCharacteristic.addEventListener('characteristicvaluechanged', handleChangedValue)
        return gattCharacteristic.startNotifications()
})
.catch(error => {
    if (error instanceof DOMException && error.name === 'NotFoundError' && error.message === 'User cancelled the requestDevice() chooser.') {
        console.log("User has canceled the device connection request.");
        logstatus("SCAN to connect");
    } else {
        console.log("Unable to connect to device: " + error);
        logstatus("ERROR");
    }
    });
}}
function disconnect()
{
    logstatus("SCAN to connect");
    console.log("Disconnected from: " + dev.name);
    return dev.gatt.disconnect();
}
function onDisconnected(event) {
    const device = event.target;
    logstatus("SCAN to connect");
    document.getElementById("buttonText").innerText = "Scan";
    console.log(`Device ${device.name} is disconnected.`);
}
function send(data)
{
    console.log("You -> " + data + "\n");
    gattCharacteristic.writeValue(str2ab(data+"\n"));
}
function str2ab(str)
{
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i = 0, l = str.length; i < l; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}
function  logstatus(text){
    const navbarTitle = document.getElementById('navbarTitle');
    navbarTitle.textContent = text;
}

let checkconnected = false;

const button = document.getElementById("toggleButton");

function toggleFunction() {
    if (button.innerText == "Scan") {
        requestBluetoothDevice();
    } else {
        disconnect();
        checkconnected = false;
    }
}
function handleAction(action) {
    if (checkconnected) {
        send(action);
    }
}

let NextStep2 = false;

function Next() {
    handleAction('Next');
    if (checkconnected) {
        Text_Area.value = "Press (+)/(-) to adjust the grippers to 90° position\nPress 'Next' to save and move to the next step";
    }
}

function Back() {
    handleAction('Back');
}

function Ldecrement() {
    handleAction('L--');
}

function Lincrement() {
    handleAction('L++');
}

function Rincrement() {
    handleAction('R++');
}

function Rdecrement() {
    handleAction('R--');
}

document.addEventListener('DOMContentLoaded', function() {
    
    const decrementBtn = document.querySelector('.L0decrement');
    const incrementBtn = document.querySelector('.L0increment');
    const quantityInput = document.querySelector('.angleLvalue');

    decrementBtn.addEventListener('click', function() {
      let currentValue = parseInt(quantityInput.value);
       if (checkconnected) {
        quantityInput.value = currentValue - 1;
       }
    });

    incrementBtn.addEventListener('click', function() {
      let currentValue = parseInt(quantityInput.value);
      if (checkconnected) {
      quantityInput.value = currentValue + 1;
      }
    });
  });
  document.addEventListener('DOMContentLoaded', function() {
    const decrementBtn = document.querySelector('.R0decrement');
    const incrementBtn = document.querySelector('.R0increment');
    const quantityInput = document.querySelector('.angleRvalue');

    decrementBtn.addEventListener('click', function() {
      let currentValue = parseInt(quantityInput.value);
      if (checkconnected) {
        quantityInput.value = currentValue - 1;
      }
    });

    incrementBtn.addEventListener('click', function() {
      let currentValue = parseInt(quantityInput.value);
      if (checkconnected) {
      quantityInput.value = currentValue + 1;
      }
    });
  });

document.addEventListener('DOMContentLoaded', function () {
    var infoButton = document.getElementById('infoButton');
    var infoContent = document.getElementById('infoContent');
  
    infoButton.addEventListener('click', function (event) {
        event.stopPropagation(); // Ngăn chặn sự kiện click lan sang các phần tử cha
        if (infoContent.style.display === 'block') {
            infoContent.style.display = 'none';
        } else {
            infoContent.style.display = 'block';
        }
    });
  
    document.addEventListener('click', function () {
        infoContent.style.display = 'none';
    });
});