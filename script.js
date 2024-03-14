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
        gattCharacteristic = characteristic
        gattCharacteristic.addEventListener('characteristicvaluechanged', handleChangedValue);
        handleAction('Step1');
        Step1();
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

let Next_Text = document.getElementById("Next");

let Rvalue = document.getElementById("angleRvalue");

let Lvalue = document.getElementById("angleLvalue");

const button = document.getElementById("toggleButton");

function toggleFunction() {
    if (button.innerText == "Scan") {
        requestBluetoothDevice();
    } else {
        disconnect();
        requestBluetoothDevice();
        Rescan();
    }
}

function Rescan(){
    checkconnected = false;
    Rvalue.value = "0";
    Lvalue.value = "0";
    toggleDisplayForElements(["R90increment", "R90decrement", "L90increment", "L90decrement"], "none");
    toggleDisplayForElements(["R0increment", "R0decrement", "L0increment", "L0decrement"], "block");
    toggleDisplayForElements(["Backbutton", "Next"], "block");
    Text_Area.value = " ";

}
let string = "";
let str = "";
let angelLvalue = "";
let angelRvalue = "";
function handleChangedValue(event) {
    let data = event.target.value;
    let dataArray = new Uint8Array(data.buffer);
    let textDecoder = new TextDecoder('utf-8');
    let valueString = textDecoder.decode(dataArray);
    let n = valueString.length;
    if(valueString[n-1]=='\n'){
        string += valueString;
        if(string[0]==='L'){
            Step3();
            Text_Area.value = string + "Step 3: Press 'Save' to write the calibration result to EEPROM";
        }
        else if(string[0]==='O'){
            Step1();
        }
        else if(string[0]==='C'){
            Step2();
        }
        else if(string[0]==='W'){
            Step4();
        }
        else if(string[0]==='d'){
            let LIndex = string.indexOf('L');
            let RIndex = string.indexOf('R');
            let i = LIndex + 4;
            angelLvalue = "";
            while (string[i] != '\t'){
                angelLvalue += string[i];
                i++;
            }
            let j = RIndex + 4;
            angelRvalue = "";
            while (string[j] != '\r'){
                angelRvalue += string[j];
                j++;
            }
            if(angelLvalue !== Lvalue.value || angelRvalue !== Rvalue.value){
                alert('THAT WRONG MESSAGE, PLEASE RESET THE WEB');
            }
        }
        console.log(string);
        string = "";
    }
    else{
        string += valueString;     
    }
}
function handleAction(action) {
    if (checkconnected) {
        send(action);
    }
}

let NextStepSave = false;

let Done = false;

let Step = 0;

function Next() {
    if(Step == 1){
        handleAction('Step2');
    }
    else if(Step == 2){
        handleAction('Step3');
    }
    else if(Step == 3){
        handleAction('Step4');
    }
}

function Step1(){
    Step = 1;
    document.getElementById("Next").innerText = "Next";
    Text_Area.value = "Step 1: Press (+)/(-) to adjust the grippers to 0° position\nPress 'Next' to save and move to the next step";
    Rvalue.value = "0";
    Lvalue.value = "0";
    toggleDisplayForElements(["R0increment", "R0decrement", "L0increment", "L0decrement"], "block");
    toggleDisplayForElements(["R90increment", "R90decrement", "L90increment", "L90decrement"], "none");
}

function Step2(){
    Step = 2;
    document.getElementById("Next").innerText = "Next";
    Text_Area.value = " Step 2: Press (+)/(-) to adjust the grippers to 90° position\nPress 'Next' to save and move to the next step";
    toggleDisplayForElements(["R90increment", "R90decrement", "L90increment", "L90decrement"], "block");
    toggleDisplayForElements(["R0increment", "R0decrement", "L0increment", "L0decrement"], "none");
    Rvalue.value = "90";
    Lvalue.value = "90";
    NextStepSave = true;
}

function Step3(){
    Step = 3;
    document.getElementById("Next").innerText = "Save";
    Done = true;
    toggleDisplayForElements(["R90increment", "R90decrement", "L90increment", "L90decrement"], "none");
}

function Step4(){
    Step = 4;
    Text_Area.value = "EEPROM written successfully";
    document.getElementById("Next").innerText = "Done";
    toggleDisplayForElements(["Backbutton"], "none");
    toggleDisplayForElements(["Next"], "none");
}

function toggleDisplayForElements(elementIds, displayValue) {
    elementIds.forEach(function(id) {
        let element = document.getElementById(id);
        if (element) {
            element.style.display = displayValue;
        }
    });
}

function Back() {
    if(Step == 3){
        handleAction('Step2');
    }
    else if(Step == 2){
        handleAction('Step1');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const buttonSets = [
      { decrement: '.L0decrement', increment: '.L0increment', input: '.angleLvalue', prefix: 'L' },
      { decrement: '.R0decrement', increment: '.R0increment', input: '.angleRvalue', prefix: 'R' },
      { decrement: '.L90decrement', increment: '.L90increment', input: '.angleLvalue', prefix: 'L' },
      { decrement: '.R90decrement', increment: '.R90increment', input: '.angleRvalue', prefix: 'R' }
    ];
  
    buttonSets.forEach(({ decrement, increment, input, prefix }) => {
      const decrementBtn = document.querySelector(decrement);
      const incrementBtn = document.querySelector(increment);
      const quantityInput = document.querySelector(input);
      let intervalId;
  
      decrementBtn.addEventListener('pointerdown', startDecrement);
      decrementBtn.addEventListener('pointerleave', stopDecrement);
  
      incrementBtn.addEventListener('pointerdown', startIncrement);
      incrementBtn.addEventListener('pointerleave', stopIncrement);
  
      function startDecrement(event) {
        intervalId = setInterval(() => decrementValue(event), 400);
        console.log("startDe");
      }
  
      function stopDecrement() {
        clearInterval(intervalId);
        console.log("stopDe");
      }
  
      function startIncrement(event) {
        intervalId = setInterval(() => incrementValue(event), 400);
        console.log("startIn");
      }
  
      function stopIncrement() {
        clearInterval(intervalId);
        console.log("stopIn");
      }
  
      function decrementValue(event) {
        let currentValue = parseInt(quantityInput.value);
        if (checkconnected) {
          quantityInput.value = currentValue - 1;
          send(prefix + quantityInput.value);
        }
      }
  
      function incrementValue(event) {
        let currentValue = parseInt(quantityInput.value);
        if (checkconnected) {
          quantityInput.value = currentValue + 1;
          send(prefix + quantityInput.value);
        }
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