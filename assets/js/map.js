document.addEventListener("DOMContentLoaded", () => {
    // Данные систем (ты можешь их редактировать или динамически подгружать из БД)
    const systems = [
        {id: "area1", name: "Alpha Centauri", info: "Первая система за пределами Солнечной. Колония основана в 2150 году."},
        {id: "area2", name: "Proxima B", info: "Экзопланета земного типа. В процессе терраформирования."},
        // ... Добавь остальные системы до area42
        {id: "area42", name: "Deep Space X", info: "Неизведанная территория. Ожидается прибытие первого конвоя в 2199 году."}
    ];

    // Создаём кликабельные области на карте
    systems.forEach(sys => {
        let area = document.createElement("area");
        area.setAttribute("shape", "poly"); // Треугольники секторов
        area.setAttribute("coords", getCoords(sys.id)); // Координаты вершин треугольника
        area.setAttribute("href", "#");
        area.onclick = () => showPopup(sys.name, sys.info);
        document.getElementById("ring-map").appendChild(area);
    });

    function getCoords(id) {
        // Здесь ты можешь задать точные координаты вершин каждого сектора на твоей схеме.
        // Для быстрого старта я сделал примерные координаты для первых двух секторов.
        switch (id) {
            case "area1": return "200,100,300,200,200,300";
            case "area2": return "300,100,400,200,300,300";
            default: return "";
        }
    }

    function showPopup(name, info) {
        const popup = document.getElementById("popup");
        popup.classList.remove("hidden");
        document.getElementById("system-name").innerText = name;
        document.getElementById("system-info").innerText = info;

        document.querySelector(".close-btn").addEventListener("click", () => {
            popup.classList.add("hidden");
        });
    }
});