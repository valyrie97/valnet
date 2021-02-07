// var upnp = require("./upnp");

// var myIp = require("ip").address();
 
// var timeout = 30000; //ms
 
// upnp.searchGateway(timeout, function(err, gateway) {
 
//   if (err) throw err;
  
//   console.log("Found Gateway!");
//   console.log("Fetching External IP ... ");
  
//   gateway.getExternalIP(function(err, ip) {
  
//     if (err) throw err;
    
//     console.log(ip);
//     console.log("Mapping port 8888->"+myIp+":8888 ... ");
    
//     gateway.AddPortMapping(
//         "TCP"               // or "UDP"
//       , 8888                  // External port
//       , 8888                // Internal Port
//       , myIp       // Internal Host (ip address of your pc)
//       , "YOUR DESCRIPTION"     // Description.
//       , function(err) {
      
//       if (err) throw err;
      
//       console.log("Success");
//       console.log("Done.");
      
//     });
    
//   });
  
// });

