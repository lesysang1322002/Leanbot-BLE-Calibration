var bleService = '0000ffe0-0000-1000-8000-00805f9b34fb';
var bleCharacteristic = '0000ffe1-0000-1000-8000-00805f9b34fb';
var gattCharacteristic;
var bluetoothDeviceDetected;

let Text_Area = document.getElementById("textareaNotification");
let Text_RGBLeds = document.getElementById("textAreaRGB");
let Text_Steppers = document.getElementById("textAreaStepper");

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
        checkMessageWithin5Seconds();
        document.getElementById("buttonText").innerText = "Rescan";
        checkconnected = true;
        gattCharacteristic = characteristic
        gattCharacteristic.addEventListener('characteristicvaluechanged', handleChangedValue);   
        return gattCharacteristic.startNotifications();
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

function send(data){
    console.log("You -> " + data + "\n");
    gattCharacteristic.writeValue(str2ab(data+"\n"));
}

function str2ab(str){
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
    document.getElementById("Next").innerText = "Next";
    checkmessage = false;
    Text_Steppers.value = 
   `Press to "Change the direction of motor rotation"
    Observe the effect: 
    If Leanbot moves forward, it means it is in the correct direction of rotation.
    If Leanbot moves backward, press to "Change the direction of motor rotation" again.`;
    Text_RGBLeds.value = 
   `Observe the LEDs:
    If the LEDs rotate clockwise, it means that the order is correct.
    If the LEDs do not rotate clockwise, press to "Reset the order of the LEDs".
    Observe until the LEDs rotate clockwise.`;
}

let string = "";
let str = "";
let angelLvalue = "";
let angelRvalue = "";
let checkmessage = false;
let old00L,old00R,old90L,old90R;

function handleChangedValue(event) {
    let data = event.target.value;
    let dataArray = new Uint8Array(data.buffer);
    let textDecoder = new TextDecoder('utf-8');
    let valueString = textDecoder.decode(dataArray);
    let n = valueString.length;
    if(valueString[n-1]=='\n'){
        string += valueString;
        let stringcheck = string[0] + string[1] + string[2] + string[3] + string[4];
        if (stringcheck === "GetCa" &&  !checkmessage) {
            console.log("Previous message within 5 seconds.");
            checkmessage = true;
            clearTimeout(timeoutCheckMessage);// Hủy kết thúc sau 5 giây
            handleAction('Step1');
            let commaIndices = [];
            for (let i = 0; i < string.length; i++) {
                if (string[i] === ',') {
                    commaIndices.push(i);
                }
            }
            let leftBracketIndex = string.indexOf('(');
            let rightBracketIndex = string.indexOf(')');
            old00L = string.substring(leftBracketIndex + 1, commaIndices[0]);
            old90L = string.substring(commaIndices[0] + 2, commaIndices[1]);
            old00R = string.substring(commaIndices[1] + 2, commaIndices[2]);
            old90R = string.substring(commaIndices[2] + 2, rightBracketIndex);
            console.log(old00L + "," + old90L + "," + old00R + "," + old90R);
        }
        else if(stringcheck ==='TB1A'){
            Text_Area.value = `TB1A + TB1B touched. Calibration settings saved. Calibration Done.`;
        }
        if(string[0]==='O'){
            Step1();
        }
        else if(string[0]==='C'){
            Step2();
        }
        else if(stringcheck === 'SetCa'){
            Step3();
        }
        else if(string[0]==='T'){
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
                alert('WRONG MESSAGE!');
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
    Text_Area.value = "Step 1/4: Adjust both gripper arms to proper 0° position (pointing down)";
    Rvalue.value = old00R;
    Lvalue.value = old00L;
    sendLR();
    toggleDisplayForElements(["R0increment", "R0decrement", "L0increment", "L0decrement"], "block");
    toggleDisplayForElements(["R90increment", "R90decrement", "L90increment", "L90decrement"], "none");
}

function Step2(){
    Step = 2;
    document.getElementById("Next").innerText = "Next";
    Text_Area.value = "Step 2/4: Adjust both gripper arms to proper 90° position (pointing horizontally)";
    toggleDisplayForElements(["R90increment", "R90decrement", "L90increment", "L90decrement"], "block");
    toggleDisplayForElements(["R0increment", "R0decrement", "L0increment", "L0decrement"], "none");
    Rvalue.value = old90R;
    Lvalue.value = old90L;
    sendLR();
}

function Step3(){
    Step = 3;
    document.getElementById("Next").innerText = "Save";
    Text_Area.value = "Step 3/4: Observe gripper open and close correctly";
    toggleDisplayForElements(["R90increment", "R90decrement", "L90increment", "L90decrement"], "none");
}

function Step4(){
    Step = 4;
    Text_Area.value = "Step 4/4: Touch TB1A + TB1B to permanently save calibration settings";
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

function GrippersTab(){
    handleAction('Grippers');
}
function RGBLedsTab(){
    handleAction('RGBLeds');
}
function SteppersTab(){
    handleAction('Steppers');
}

function ResetLeds(){
    handleAction('ResetRGB');
}

function saveRGB(){
    handleAction('saveRGB');
}

function ChangeRotation(){
    handleAction('Change');
}

function stopLeanbot(){
    handleAction('Stop');
}

function saveSteppers(){
    handleAction('saveStep');
}

document.addEventListener('DOMContentLoaded', function() {
    const buttonSets = [
      { decrement: '.L0decrement', increment: '.L0increment', input: '.angleLvalue' },
      { decrement: '.R0decrement', increment: '.R0increment', input: '.angleRvalue'},
      { decrement: '.L90decrement', increment: '.L90increment', input: '.angleLvalue'},
      { decrement: '.R90decrement', increment: '.R90increment', input: '.angleRvalue'}
    ];
  
    buttonSets.forEach(({ decrement, increment, input}) => {
      const decrementBtn = document.querySelector(decrement);
      const incrementBtn = document.querySelector(increment);
      const quantityInput = document.querySelector(input);
      let intervalId;
  
      decrementBtn.addEventListener('pointerdown', startDecrement);
      decrementBtn.addEventListener('click', decrementValue);
      decrementBtn.addEventListener('pointerleave', stopDecrement);
      decrementBtn.addEventListener('pointerup', stopDecrement);
  
      incrementBtn.addEventListener('pointerdown', startIncrement);
      incrementBtn.addEventListener('click', incrementValue);
      incrementBtn.addEventListener('pointerleave', stopIncrement);
      incrementBtn.addEventListener('pointerup', stopIncrement);
      
  
      function startDecrement(event) {
        intervalId = setInterval(() => decrementValue(event), 400);
      }
  
      function stopDecrement() {
        clearInterval(intervalId);
      }
  
      function startIncrement(event) {
        intervalId = setInterval(() => incrementValue(event), 400);
      }
  
      function stopIncrement() {
        clearInterval(intervalId);
      }
      
      function decrementValue(event) {
        let currentValue = parseInt(quantityInput.value);
        if (checkconnected) {
          quantityInput.value = currentValue - 1;
          sendLR();
        }
      }
  
      function incrementValue(event) {
        let currentValue = parseInt(quantityInput.value);
        if (checkconnected) {
          quantityInput.value = currentValue + 1;
          sendLR();
        }
      }
    });
  });

function sendLR(){
    send ('LR' + ' ' + Lvalue.value + ' ' + Rvalue.value);
}

let timeoutCheckMessage;

function checkMessageWithin5Seconds() {
    // Thiết lập hàm setTimeout để kết thúc sau 5 giây
        timeoutCheckMessage = setTimeout(function() {
        console.log("5 seconds timeout, message incorrect.");
        let infoBox = document.getElementById("infopopup");
        // Hiển thị info box
        infoBox.style.display = "block";
        document.addEventListener("click", function(event) {
            if (!infoBox.contains(event.target)) {
                infoBox.style.display = "none";
            }
        });
    }, 5000);
}

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
function showTab(tabId) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.content');
    
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    contents.forEach(content => {
        content.classList.remove('active');
    });
    
    document.getElementById(tabId).classList.add('active');
    document.getElementById('tab' + tabId.slice(-1)).classList.add('active');
}
