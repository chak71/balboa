const net = require('net');
const crc = require('crc');
const config = require('./config');

var client = new net.Socket();
var TCPHOST = config.spa.host;
var TCPPORT = config.spa.port;


const SpaResponseMessageIDs = {
  msStatus : '0xffaf13',
	msConfigResponse : '0x0abf94',
	msFilterConfig : '0x0abf23',
	msControlConfig : '0x0abf24',
	msControlConfig2 : '0x0abf2e',
	msSetTempRange : '0xffaf26'
};

const SpaCommandMessageID = {
	msConfigRequest : '0x0abf04',
	msFilterConfigRequest : '0x0abf22',
	msToggleItemRequest : '0x0abf11',
	msSetTempRequest : '0x0abf20',
	msSetTempScaleRequest : '0x0abf27',
	msSetTimeRequest : '0x0abf21',
	msSetWiFiSettingsRequest : '0x0abf92',
	msControlConfigRequest : '0x0abf22'
};

//Each message requires MessageTerminators, MessageLength, MessageId (3 bytes), CrcByte
//  MT ML MI MI MI ... CB MT
const cMessageOverhead = 7;
const byMessageTerminator = 0x7e;

client.connect(TCPPORT, TCPHOST, function() {

    console.log('CONNECTED TO: ' + TCPHOST + ':' + TCPPORT);
    // Write a message to the socket as soon as the client is connected, the server will receive it as message from the client
    SendConfigRequest();

});

function FillInMessageOverhead(
	Message,
	ID,
	PayloadLength)
{
	Message[0] = byMessageTerminator;
	Message[Message.length - 1] = byMessageTerminator;

	Message[1] = PayloadLength + cMessageOverhead - 2;
	Message[2] = (ID >> 16) & 0xff;
	Message[3] = (ID >> 8) & 0xff;
	Message[4] = (ID) & 0xff;
  console.log('FillInMessageOverhead: ', Message);
  return Message;
}


function FillInMessageCRC(Message)
{
  var MessageCRC = crc.crc8(Message).toString(16);
	//crc MessageCRC = F_CRC_CalculaCheckSum(&Message[1], (UINT)(Message.size() - 3));
	Message[Message.length - 2] = MessageCRC;
  console.log("FillInMessageCRC: ", Message);
  return Message;
}


function SendSpaMessage(Message)
{
  console.log("SendSpaMessage: ", Message);
  client.write(Message.toString());

}


function SendConfigRequest()
{
	var Message = [];

	FillInMessageOverhead(Message, SpaCommandMessageID.msConfigRequest, 0);

	FillInMessageCRC(Message);

	return SendSpaMessage(Message);
}

// Add a 'data' event handler for the client socket
// data is what the server sent to this socket
client.on('data', function(Message) {
    var MessageString = datatohex(Message).split(" ");
    console.log('MessageStringX: ' + MessageString);
    // Close the client socket completely
    //client.destroy();
    MessageID = '0x' + MessageString[2] + MessageString[3] + MessageString[4];
    MessageString.splice(0, 6);
    console.log('MessageString: ' + MessageString);

    switch (MessageID) {
      case SpaResponseMessageIDs.msConfigResponse:
        // Do something for summer beginning
        console.log('msConfigResponse: ' + MessageID);
      case SpaResponseMessageIDs.msStatus:
        console.log('msStatus: ' + MessageID);
        //console.log('F1 : ' + (if (MessageString[6] & 0x01) "priming" ;
        console.log('Current Temperature : ' + parseInt(MessageString[1], 16)/2);
        console.log('HH : MM : ' + parseInt(MessageString[2],16) + ":" + parseInt(MessageString[3],16));

        console.log(MessageString[4]);
        switch(MessageString[4]) {
          case '00':
            console.log('Heatmode: Ready');
            break;
          case '01':
            console.log('Heatmode: Rest');
            break;
          case '03':
            console.log('Heatmode: Ready in rest');
            break;
          default:
            console.log('Heatmode: Fault?');
        }

        console.log('F2 : ' + MessageString[4]);
        console.log('Set Temperature : ' + parseInt(MessageString[19], 16)/2);
        if ((MessageString[9] | 0x01) == 0x01)
        {
          console.log('Temperature : Celsius' );
        } else {
          console.log('Temperature : Farenheit' );
        }
        if ((MessageString[9] == 0x02))
        {
          console.log('Clock : 12H' );
        } else {
          console.log('Clock : 24H' );
        }
        console.log(MessageString[12]);
        if ((MessageString[12] == 0x02))
        {
          console.log('Circulation : ON' );
        } else {
          console.log('Circulation : OFF' );
        }
        console.log(MessageString[13]);
        if ((MessageString[13] == 0x03))
        {
          console.log('Lamp : ON' );
        } else {
          console.log('Lamp : OFF' );
        }
        console.log(MessageString[10]);
        if ((MessageString[10] == 0x02))
        {
          console.log('Pump1 : ON' );
        } else {
          console.log('Pump1 : OFF' );
        }
        switch(MessageString[10]) {
          case '02':
            console.log('Pump1 : ON');
            console.log('Pump2 : OFF');
            console.log('Blower : OFF');
            break;
          case '0a':
            console.log('Pump1 : ON');
            console.log('Pump2 : ON');
            console.log('Blower : OFF');
            break;
          case '12':
            console.log('Pump1 : OFF');
            console.log('Pump2 : ON');
            console.log('Blower : OFF');
            break;
          case '00':
            console.log('Pump1 : OFF');
            console.log('Pump2 : OFF');
            console.log('Blower : OFF');
            break;
          default:
            console.log('Heatmode: Fault?');
        }
    }

});

// Add a 'close' event handler for the client socket
client.on('close', function() {
    console.log('Connection closed');
});

function datatohex(data) {
    var result = data.toString('hex').replace(/(.{2})/g, "$1 ");
    //console.log('Data: ' + result);
    return result;
}

function hextodata(data) {
    var result = '';
    var array = data.toString().split(' ');
    //console.log('hextodata arg: ' + data);
    for (var i = 0; i < data.length; i++) {
            result += String.fromCharCode(array[i]);
            console.log(String.fromCharCode(array[i]));
    }
    //console.log('hextodata result: ' + result);
    return result;
}
