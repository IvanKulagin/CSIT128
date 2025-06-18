function search() {
    fetch("/api/internships", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: document.getElementById("searchInput").value.trim().split(" "),
            company: Array.from(document.querySelectorAll("#company input:checked"), item => item.value),
            type: Array.from(document.querySelectorAll("#type input:checked"), item => item.value),
        })
    })
        .then(response => response.json())
        .then(json => {
            div = document.getElementById("internshipsContainer")
            div.innerHTML = ""
            json.forEach((element) => {
                div.innerHTML += `<a href="student_internship.html">
                    <div class="internship-card">
                        <h3>${element.title}</h3>
                        <p><strong>Company:</strong> ${element.name}</p>
                        <p><strong>Type:</strong> ${element.type}</p>
                        <p><strong>Duration:</strong> ${element.duration} Months</p>
                    </div>
                </a>`
                /*
                div.innerHTML += element.title + " "
                if (element.application !== null) {
                    div.innerHTML += element.status !== null ? element.status : "On review"
                }
                else {
                    div.innerHTML += `<a href="/student/internship/${element.id}">Apply</a>`
                }
                div.innerHTML += "<br>"
                */
            })
        })
}
document.addEventListener("DOMContentLoaded", search)
document.getElementById("searchInput").addEventListener("input", search)
Array.from(document.querySelectorAll("#company input"), item => item.addEventListener("change", search))
Array.from(document.querySelectorAll("#type input"), item => item.addEventListener("change", search))
