function search() {
    fetch("/student/internship", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            search: document.getElementById("searchInput").value.trim().split(" "),
            company: Array.from(document.querySelectorAll("#company input:checked"), item => item.value),
            type: Array.from(document.querySelectorAll("#type input:checked"), item => item.value),
            salary: document.getElementById("salary").value,
            duration: document.getElementById("duration").value
        })
    })
        .then(response => response.json())
        .then(json => {
            div = document.getElementById("internshipsContainer")
            div.innerHTML = ""
            json.forEach((element) => {
                div.innerHTML += `<a href="internship/${element.id}">
                    <div class="internship-card">
                        <h3>${element.title}</h3>
                        <p><strong>Company:</strong> ${element.name}</p>
                        <p><strong>Location:</strong> ${element.location}</p>
                        <p><strong>Type:</strong> ${element.type}</p>
                        <p><strong>Salary:</strong> ${element.salary}</p>
                        <p><strong>Duration:</strong> ${element.duration} Month(s)</p>
                    </div>
                </a>`
            })
        })
}
document.addEventListener("DOMContentLoaded", search)
document.getElementById("searchInput").addEventListener("input", search)
Array.from(document.querySelectorAll("#company input"), item => item.addEventListener("change", search))
Array.from(document.querySelectorAll("#type input"), item => item.addEventListener("change", search))
document.getElementById("salary").addEventListener("input", search)
document.getElementById("duration").addEventListener("input", search)
document.getElementById("duration").addEventListener("input", (event) => {
    document.getElementById("durationValue").innerHTML = event.target.value
})
document.getElementById("clear").addEventListener("click", (event) => {
    document.querySelectorAll("input:checked").forEach((input) => {
        input.checked = false
    })
    document.getElementById("salary").value = 0
    document.getElementById("duration").value = 12
    document.getElementById("durationValue").innerHTML = 12
    search()
})
