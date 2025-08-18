# Interactive Linked List Polynomial Visualizer

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

An advanced, interactive web-based tool designed to teach the core concepts of linked lists by visualizing polynomial arithmetic (addition, subtraction, and multiplication). This project was built as a comprehensive educational resource to make abstract data structure operations tangible and easy to understand.


## Features

This visualizer goes beyond a simple demonstration and includes several advanced features to provide a deep learning experience:

* **Real-Time Visualization:** Watch linked lists get created and manipulated step-by-step as the algorithms run.
* **Dynamic Node Allocation:** New nodes for the result list are shown originating from a "Memory Pool," visually demonstrating the concept of dynamic memory allocation (`new Node()`).
* **Visual Pointers:** Track the algorithm's state with animated pointers (`p1`, `p2`, `result`) that move between nodes.
* **Head Pointers:** Each list has a dedicated `head` pointer, reinforcing the concept of the list's entry point.
* **Live Commentary:** A real-time commentary box explains *why* each step is happening in plain English.
* **C++ Code Correlation:** A C++ code snippet box highlights the exact line of code being executed for each visual step.
* **Variable State Tracking:** A dedicated panel shows the real-time values of key variables (like `p1->power`, `sum`, etc.) as they change.
* **Full Animation Control:** Play, pause, step forward, and control the animation speed to learn at your own pace.
* **Handles Edge Cases:** The logic correctly visualizes operations on empty lists and handles the creation of zero-coefficient nodes.

---

## How to Use

To run this project locally, follow these simple steps:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Yashvardhan-4/LinkedList-Visualization.git](https://github.com/Yashvardhan-4/LinkedList-Visualization.git)
    ```
2.  **Navigate to the directory:**
    ```bash
    cd LinkedList-Visualization
    ```
3.  **Open the HTML file:**
    * The easiest way is to use a live server extension (like "Live Server" in VS Code).
    * Alternatively, you can simply open the `visualisatiion_dsa.html` file directly in your web browser.

---

## Technologies Used

* **HTML5:** For the structure and layout of the application.
* **CSS3:** For all styling, including the two-column layout, animations, and visual elements.
* **JavaScript (ES6+):** For all the core logic, DOM manipulation, and algorithm implementation.
* **Anime.js:** A lightweight JavaScript animation library used to create smooth transitions for the nodes and pointers.

---

## Key Concepts Demonstrated

This project is designed to visually explain several fundamental computer science concepts:

* **Data Structures:** The implementation and manipulation of Linked Lists.
* **Pointers/References:** The core concept of nodes pointing to the `next` node in the sequence, including `head` pointers and `NULL` termination.
* **Dynamic Memory Allocation:** The idea of creating nodes "on the fly" as needed.
* **Algorithms:** Step-by-step execution of list traversal, insertion, and merging as applied to polynomial arithmetic.
* **Edge Case Handling:** Demonstrates how robust algorithms handle empty lists and zero-value results.
