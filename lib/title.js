const formPhrase = require("font-ascii").default;
const { strlen, ansiEscapeCodes} = require ('printable-characters');
const chalk = require('chalk').default;
const gradient = require('gradient-string');


module.exports.title = function(component, cls = true) {

  if(cls) {
    process.stdout.cursorTo(0, 0);
    process.stdout.clearScreenDown();
  }
  const bigDisplay = process.stdout.getWindowSize()[1] > 45
  if(bigDisplay) console.log();

// 	centerString(`
//                  /\\          .-.      .-.              .-.-.;;;;;;' 
// .;.       .-._  / |        ;' (_)       ;  :   .;;;.\`-' (_)  .;     
//  \`;     .'  (  /  |  .   .:'          .;:  :  ;;  (_)        :      
//   ;;  .'     \`/.__|_.'  .:'          .;' \\ :  .;;; .-.     .:'      
//  ;;  ;   .:' /    |   .-:.    .-..:'.;    \\: ;;  .;  ;   .-:._      
//  \`;.'   (__.'     \`-'(_/ \`;._.  (__.'      \`.\`;.___.'   (_/  \`-     
// 	`);

	centerString(`
               /\\         .-.       .-.             .-.--------' 
.-.     .-._  / |        / (_)        /  |  .---;\`-' (_)   /     
   )   /  (  /  |  .    /            /\\  | (   (_)        /      
  /   /    \`/.__|_.'   /            /  \\ |  )--          /       
 (  .' .:' /    |   .-/.    .-..-' /    \\| (      /   .-/._      
  \\/  (__.'     \`-'(_/ \`-._.  (__.'      \`.\`\\___.'   (_/   \`-     `);

	if(bigDisplay) centerString(`
            ______________________
           /\\  __________________ \\
          /XX\\ \\________________/\\ \\
         /X/\\X\\ \\            /X/\\X\\ \\
        /X/ /\\X\\ \\          /X/ /\\X\\ \\
       /X/ /  \\X\\ \\________/_/_/__\\_\\ \\____________________
      /X/ /    \\X\\____________________  __________________ \\
     /X/ /     /X/ __________________/\\ \\________________/\\ \\
    /X/ /_____/X/ /_____/X/ /_____/X/\\X\\ \\____        /X/\\X\\ \\
   /X/_/_____/X/ /______\\/_/_____/X/ /\\X\\ \\__ \\      /X/ /\\X\\ \\
   \\X\\ \\____/X/ /_______/\\ \\____/X/ /__\\X\\ \\/\\ \\____/_/_/__\\_\\ \\
    \\X\\ \\  /X/ /     /X/\\X\\ \\  /X/ /    \\X\\_____________________\\ 
     \\X\\ \\/X/ /     /X/ /\\X\\_\\/X/ /     /X/ __________________  /
      \\X\\/X/ /_____/_/_/__\\_\\/X/_/_____/X/ /__\\_\\/X/_/     /X/ /
       \\XX/_/________________\\/_/_____/X/ /______\\/_/     /X/ /
       /XX\\ \\________________/\\ \\____/X/ /______ /\\ \\    /X/ /
      /X/\\X\\ \\  /X/ /_____/X/\\X\\ \\__/X/ /     /X/\\X\\ \\  /X/ /
     /X/ /\\X\\ \\/X/_/_____/X/ /\\X\\ \\/X/ /     /X/ /\\X\\ \\/X/ /
    /X/ /  \\X\\ \\_\\_\\____/_/_/__\\_\\/X/ /\\____/_/_/__\\_\\/X/ /
   /X/ /    \\X\\___________________\\/ /________________\\/ /
  /X/ /     /X/ __________________  ____________________/
 /X/ /_____/X/ /__\\_\\/X/ /_____/X/ /__\\_\\/X/ /
/X/_/_____/X/ /______\\/_/_____/X/ /______\\/ /
\\X\\ \\____/X/ /_______/\\ \\____/X/ /_________/
 \\X\\ \\  /X/ /        \\X\\ \\  /X/ /
  \\X\\ \\/X/ /          \\X\\ \\/X/ /
   \\X\\/X/ /____________\\_\\/X/ /
    \\XX/ /________________\\/ /
     \\/_____________________/`);

	console.log();
	if(bigDisplay) console.log();

	centerString((formPhrase(component, {
		typeface: 'Small',
		color: 'yellow',
		silent: true
	})))
}




function centerString(string, options = {}) {
	const windowWidth = process.stdout.getWindowSize()[0];

	const text = string.replace(ansiEscapeCodes, '').split('\n');

	const textWidth = Math.max.apply(this, text.map(v => strlen(v)));

	const padding = ' '.repeat(Math.floor((windowWidth - textWidth) / 2));

	for(const line of 
		gradient.pastel.multiline(text.join('\n')).split('\n')
	) {
		console.log(padding + line);
	}
}