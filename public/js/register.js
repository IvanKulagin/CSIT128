document.getElementById("register-form").addEventListener("submit", (event) => {
    if (document.getElementById("password").value != document.getElementById("confirm").value) {
        event.preventDefault()
        document.getElementById("alert").innerHTML = `<div class="alert">
            <p>Passwords don't match</p>
        </div>`
    }
})
