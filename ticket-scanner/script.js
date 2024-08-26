class Scanner {
	init() {
		this.html5QrCodeScanner = new Html5QrcodeScanner("reader", {
            fps: 10,
            qrbox: 250
          });
          
          this.html5QrCodeScanner.render(this.onScanSuccess, this.onScanError);
	}

    // When scan is successful fucntion will produce data
    onScanSuccess(qrCodeMessage) {
        if (qrCodeMessage.toLowerCase().includes("riverzoneticket")) {
        document.getElementById("start-row").classList.add("display-none");
        const successRow = document.getElementById("success-row");
        successRow.classList.remove("display-none");
    
        setTimeout(() => {
            successRow
            .querySelector(".first-sub-message")
            .classList.add("opacity-none");
            successRow
            .querySelector(".not-first-sub-message")
            .classList.remove("opacity-none");
        }, 2000);
        } else {
        document.getElementById("start-row").classList.add("display-none");
        document.getElementById("error-row").classList.remove("display-none");
    
        setTimeout(() => {
            document.getElementById("start-row").classList.remove("display-none");
            document.getElementById("error-row").classList.add("display-none");
        }, 5000);
        }
    }
    
    // When scan is unsuccessful fucntion will produce error message
    onScanError(errorMessage) {}  
}