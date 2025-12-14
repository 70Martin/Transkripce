let recognition;
let isRecording = false;
let fullText = "";
let numbersArray = [];

function startStopRecording() {
   if (isRecording) {
       recognition.stop();
       isRecording = false;
       document.getElementById("startStopButton").textContent = "Začít nahrávat";
       document.getElementById("startStopButton").style.backgroundColor = "#1E88E5";
       gtag('event', 'stop_recording', {
           'event_category': 'Button',
           'event_label': 'Stop Recording'
       });
   } else {
       recognition.start();
       isRecording = true;
       document.getElementById("startStopButton").textContent = "Zastavit nahrávání";
       document.getElementById("startStopButton").style.backgroundColor = "red";
       gtag('event', 'start_recording', {
           'event_category': 'Button',
           'event_label': 'Start Recording'
       });
   }
}

function initSpeechRecognition() {
   if (!('webkitSpeechRecognition' in window)) {
       alert("Váš prohlížeč nepodporuje tuto funkci.");
       return;
   }

   recognition = new webkitSpeechRecognition();
   recognition.lang = 'cs-CZ';
   recognition.interimResults = true;

   recognition.onstart = function() {
       console.log("Nahrávání začalo.");
   };

   recognition.onresult = function(event) {
       let interimTranscript = '';
       let finalTranscript = '';

       for (let i = event.resultIndex; i < event.results.length; i++) {
           let transcript = event.results[i][0].transcript;

           if (event.results[i].isFinal) {
               transcript = convertNumberWordsToDigits(transcript);
               finalTranscript += transcript + ' ';
               let numbers = transcript.match(/\d+(\.\d+)?/g);
               if (numbers) {
                   numbers.forEach(number => {
                       numbersArray.push(number);
                   });
               }
           } else {
               interimTranscript += transcript;
           }
       }

       fullText += finalTranscript;
       document.getElementById("transcription").innerText = fullText + interimTranscript;

       updateNumbers();
   };

   recognition.onerror = function(event) {
       console.error("Chyba při rozpoznávání řeči:", event.error);
   };

   recognition.onend = function() {
       console.log("Nahrávání bylo ukončeno.");
       if (isRecording) {
           recognition.start();
       }
   };
}

function convertNumberWordsToDigits(text) {
   const numberWords = {
       "jedna": "1", "dva": "2", "dvě": "2", "tři": "3", "čtyři": "4",
       "pět": "5", "šest": "6", "sedm": "7", "osm": "8", "devět": "9", "deset": "10"
   };
   let result = text.split(" ").map(word => numberWords[word.toLowerCase()] || word).join(" ");
   result = result.replace(/(\d+),(\d+)/g, "$1.$2");
   return result.replace(/(\d+)\s(\d+)/g, "$1$2");
}

function changeTheme() {
   let body = document.body;

   if (body.classList.contains('dark-mode')) {
       body.classList.remove('dark-mode');
       body.classList.add('blue-theme');
   } else if (body.classList.contains('blue-theme')) {
       body.classList.remove('blue-theme');
       body.classList.add('dark-mode');
   } else {
       body.classList.add('dark-mode');
   }

   gtag('event', 'toggle_theme', {
       'event_category': 'Button',
       'event_label': 'Theme Changed'
   });
}

function saveTextToFile() {
   fullText = document.getElementById("transcription").innerText;
   const blob = new Blob([fullText], { type: 'text/plain' });
   const link = document.createElement('a');
   link.href = URL.createObjectURL(blob);
   link.download = 'transcription.txt';
   link.click();

   gtag('event', 'save_text_file', {
       'event_category': 'Button',
       'event_label': 'Text File Saved'
   });
}

function saveNumbersToExcel() {
   // Vytvoření dat pro Excel - každé číslo na samostatném řádku
   const data = numbersArray.map(number => [number]);
   
   // Vytvoření nového sešitu (workbook)
   const wb = XLSX.utils.book_new();
   
   // Vytvoření listu (worksheet) z dat
   const ws = XLSX.utils.aoa_to_sheet([['Čísla'], ...data]);
   
   // Přidání listu do sešitu
   XLSX.utils.book_append_sheet(wb, ws, 'Čísla');
   
   // Uložení souboru
   XLSX.writeFile(wb, 'numbers.xlsx');

   gtag('event', 'save_numbers_excel', {
       'event_category': 'Button',
       'event_label': 'Numbers Excel Saved'
   });
}

function updateNumbers() {
   let numbersContainer = document.getElementById("numbers");
   numbersContainer.innerHTML = '';

   numbersArray.forEach((number, index) => {
       let numberItem = document.createElement("div");
       numberItem.classList.add("number-item");

       let numberInput = document.createElement("input");
       numberInput.type = "text";
       numberInput.value = number;
       numberInput.dataset.index = index;

       numberInput.onchange = updateNumberValue;

       numberItem.appendChild(numberInput);
       numbersContainer.appendChild(numberItem);
   });
}

function updateNumberValue(event) {
   let index = event.target.dataset.index;
   numbersArray[index] = event.target.value;
}

function loadFile(event) {
   const file = event.target.files[0];

   if (file) {
       const reader = new FileReader();

       reader.onload = function(e) {
           const text = e.target.result;

           fullText = text;
           document.getElementById("transcription").innerText = fullText;

           const numbers = text.match(/\d+(\.\d+)?/g);
           if (numbers) {
               numbersArray = numbers;
               updateNumbers();
           }
       };

       reader.readAsText(file);
   }

   gtag('event', 'load_text_file', {
       'event_category': 'Button',
       'event_label': 'Text File Loaded'
   });
}

function toggleNavod() {
   const navodContainer = document.getElementById("navodContainer");
   navodContainer.style.display =
      navodContainer.style.display === 'none' ? 'block' : 'none';

   gtag('event', 'toggle_help', {
       'event_category': 'Button',
       'event_label': 'Toggle Help Section'
   });
}

window.onload = function() {
   initSpeechRecognition();
};

if ('serviceWorker' in navigator) {
   navigator.serviceWorker.register('/service-worker.js')
      .then(registration => console.log('Service Worker registrován:', registration))
      .catch(error => console.log('Registrace Service Workeru selhala:', error));
}