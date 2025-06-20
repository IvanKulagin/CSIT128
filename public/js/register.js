document.getElementById("register-form").addEventListener("submit", (event) => {
    if (document.getElementById("password").value != document.getElementById("confirm").value) {
        event.preventDefault()
        alert("Passwords don't match")
    }
})
