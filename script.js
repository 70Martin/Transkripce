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
   } else {
       recognition.start();
       isRecording = true;
       document.getElementById("startStopButton").textContent = "Zastavit nahrávání";
       document.getElementById("startStopButton").style.backgroundColor = "red";
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
               const labeledNumbers = extractLabeledNumbers(transcript);
               labeledNumbers.forEach(item => numbersArray.push(item));
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
   
   // Převod číslovek na číslice
   let result = text.split(" ").map(word => numberWords[word.toLowerCase()] || word).join(" ");
   
   // Převod čárky na tečku v desetinných číslech
   result = result.replace(/(\d+),(\d+)/g, "$1.$2");
   
   // Slepení čísel oddělených mezerou (123 místo 1 2 3)
   result = result.replace(/\b(\d+)\s+(\d+)\b/g, "$1$2");
   
   return result;
}

function extractLabeledNumbers(text) {
    const tokens = text.trim().split(/\s+/);
    const numberRegex = /^\d+(\.\d+)?$/;
    const results = [];

    for (let i = 0; i < tokens.length; i++) {
        if (numberRegex.test(tokens[i])) {
            const prev = tokens[i - 1];
            const label = (prev && !numberRegex.test(prev)) ? prev : '';
            results.push({ label: label, value: tokens[i] });
        }
    }
    return results;
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
}

function saveTextToFile() {
   fullText = document.getElementById("transcription").innerText;
   const blob = new Blob([fullText], { type: 'text/plain' });
   const link = document.createElement('a');
   link.href = URL.createObjectURL(blob);
   link.download = 'transcription.txt';
   link.click();
}

function saveNumbersToExcel() {
   const data = numbersArray.map(item => [item.label, item.value]);
   const wb = XLSX.utils.book_new();
   const ws = XLSX.utils.aoa_to_sheet([['Popis', 'Číslo'], ...data]);
   XLSX.utils.book_append_sheet(wb, ws, 'Čísla');
   XLSX.writeFile(wb, 'numbers.xlsx');
}

function updateNumbers() {
   let numbersContainer = document.getElementById("numbers");
   numbersContainer.innerHTML = '';

   numbersArray.forEach((item, index) => {
       let numberItem = document.createElement("div");
       numberItem.classList.add("number-item");

       let labelInput = document.createElement("input");
       labelInput.type = "text";
       labelInput.value = item.label;
       labelInput.placeholder = "popis";
       labelInput.dataset.index = index;
       labelInput.dataset.field = "label";
       labelInput.onchange = updateNumberValue;

       let valueInput = document.createElement("input");
       valueInput.type = "text";
       valueInput.value = item.value;
       valueInput.dataset.index = index;
       valueInput.dataset.field = "value";
       valueInput.onchange = updateNumberValue;

       numberItem.appendChild(labelInput);
       numberItem.appendChild(valueInput);
       numbersContainer.appendChild(numberItem);
   });
}

function updateNumberValue(event) {
   const index = event.target.dataset.index;
   const field = event.target.dataset.field;
   numbersArray[index][field] = event.target.value;
}

function loadFile(event) {
   const file = event.target.files[0];

   if (file) {
       const reader = new FileReader();

       reader.onload = function(e) {
           const text = e.target.result;

           fullText = text;
           document.getElementById("transcription").innerText = fullText;

           numbersArray = extractLabeledNumbers(text);
           updateNumbers();
       };

       reader.readAsText(file);
   }
}

function toggleNavod() {
   const navodContainer = document.getElementById("navodContainer");
   navodContainer.style.display =
      navodContainer.style.display === 'none' ? 'block' : 'none';
}

window.onload = function() {
   initSpeechRecognition();
};

if ('serviceWorker' in navigator) {
   navigator.serviceWorker.register('/service-worker.js')
      .then(registration => console.log('Service Worker registrován:', registration))
      .catch(error => console.log('Registrace Service Workeru selhala:', error));
}