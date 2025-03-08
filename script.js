window.onload = function (){
    let game_state = true;
    let match_start = false;
    let start_time_counter = 0;
    let nr_bombs = 0;

    const colors = ["blue", "green", "orange", "darkblue", "brown", "cyan", "black", "gray"];
    let matrix = [];

    const defuses_nr = document.getElementById("stamp-defuse");
    const game_time = document.getElementById("stamp-time");
    const landmine = document.getElementById("landmine");
    const restart_button = document.getElementById("restart-button");
    const radios = document.querySelectorAll('input[name="diff"]');

    if (localStorage.getItem("Last_dif")) document.querySelector(`input[id="${localStorage.getItem("Last_dif")}"][name="diff"]`).checked = true;
    else radios[1].checked = true;
    radios.forEach((radio) => {
        if (radio.checked) {
            nr_bombs = radio.value;
        }
        radio.addEventListener("change", function (event){
            localStorage.setItem("Last_dif", event.target.id);
        });
    });

    if (localStorage.getItem("Screen") === "light"){
        document.body.style.backgroundColor = "#f9f9f9";
        document.getElementById("light_dark").style.borderColor = "#050505";
        document.getElementById("diff").style.borderColor = "#050505";
    }else if (localStorage.getItem("Screen") === "dark"){
        document.body.style.backgroundColor = "#050505";
        document.getElementById("light_dark").style.borderColor = "#f9f9f9";
        document.getElementById("diff").style.borderColor = "#f9f9f9";
    }

    defuses_nr.innerHTML = `${parseInt(nr_bombs, 10)}`.padStart(3, '0');
    game_time.innerHTML = "000";

    for (let i = 0; i < 16; i++){                       // Generates the game-panel
        const row = document.createElement("div");
        landmine.appendChild(row);

        matrix[i] = [];
        for (let j = 0; j < 30; j++){
            let block = document.createElement("div");
            block.className = "block";
            block.id = `${i}-${j}`;
            matrix[i][j] = 0;

            block.onclick = function (){
                if (!match_start && this.style.backgroundImage !== 'url("Img/flag.png")'){    // Start the game
                    match_start = true;
                    bomb_generator(i, j);
                    block_spread(i, j);

                    if (!start_time_counter) {          // Starts the timer once the first block is pressed
                        start_time_counter = setInterval(function () {
                            if (game_time.innerHTML === "999") clearInterval(start_time_counter);
                            game_time.innerHTML = `${parseInt(game_time.innerHTML) + 1}`.toString().padStart(3, '0');
                        }, 1000);
                    }

                }else if (game_state && this.style.backgroundImage !== 'url("Img/flag.png")'){      // During the game
                    if (matrix[i][j] !== 1) {
                        block_spread(i, j);
                        if (document.getElementsByClassName("number-block").length === 16*30-nr_bombs){   // Winning condition
                            game_state = false;
                            restart_button.style.backgroundImage = 'url("Img/Victory.png")';
                            clearInterval(start_time_counter);

                            let remain_blocks = document.getElementsByClassName('block');
                            for (let i = 0; i < remain_blocks.length; i++){                     // Rest of the bombs gets flag-ed
                                remain_blocks[i].style.backgroundImage = 'url("Img/flag.png")';
                            }
                            defuses_nr.innerHTML = "000";
                        }
                    }
                    else{                                                               // Losing condition
                        game_state = false;
                        let all_bombs = document.getElementsByClassName("bomb-block");
                        for (let i = 0; i < all_bombs.length; i++) {                            // Show all the bombs
                            if (all_bombs[i].style.backgroundImage !== 'url("Img/flag.png")') all_bombs[i].style.backgroundImage = 'url("Img/bomb.png")';
                        }

                        let remain_blocks = document.getElementsByClassName("block");
                        for (let i = 0; i < remain_blocks.length; i++) {                            // Show all the misplaced flags
                           if (!remain_blocks[i].classList.contains("bomb-block") && remain_blocks[i].style.backgroundImage === 'url("Img/flag.png")'){
                               remain_blocks[i].style.backgroundImage = 'url("Img/flag2.png")';
                           }
                        }

                        restart_button.style.backgroundImage = 'url("Img/Dead.png")';
                        clearInterval(start_time_counter);
                    }
                }
            }

            block.addEventListener("contextmenu", function (e){         // Adding/Removing a flag
                e.preventDefault();
                if (this.style.backgroundImage !== 'url("Img/flag.png")' && !this.classList.contains("number-block") && game_state) {
                    this.style.backgroundImage = 'url("Img/flag.png")';
                    defuses_nr.innerHTML = `${parseInt(defuses_nr.innerHTML) - 1}`.toString().padStart(3,'0');
                }else if (!this.classList.contains("number-block") && game_state){
                    this.style.backgroundImage = '';
                    defuses_nr.innerHTML = `${parseInt(defuses_nr.innerHTML) + 1}`.toString().padStart(3,'0');
                }
            });

            row.appendChild(block);
        }
    }

    function bomb_generator(a,b){           // Generates random-positioned bombs with 'bomb-block' as class name
        let bomb_row, bomb_column;

        for (let aux = 0; aux < nr_bombs; aux++) {
            bomb_row = Math.floor(Math.random() * 16);
            bomb_column = Math.floor(Math.random() * 30);
            if (matrix[bomb_row][bomb_column] !== 1 && (Math.abs(a - bomb_row) > 1 || Math.abs(b - bomb_column) > 1)) {
                matrix[bomb_row][bomb_column] = 1;
                document.getElementById(`${bomb_row}-${bomb_column}`).classList.add("bomb-block");
            } else aux--;
        }
    }

    function block_spread(a,b){         // Checks the initial block and wipes the "0" number-blocks
        let chosen_block = document.getElementById(`${a}-${b}`);
        if (a >= 0 && a < 16 && b >= 0 && b < 30 && matrix[a][b] !== 2 && chosen_block.style.backgroundImage !== 'url("Img/flag.png")') {
            matrix[a][b] = 2;

            chosen_block.classList.remove("block");
            chosen_block.classList.add("number-block");
            let number = get_number(a, b);

            if (number) chosen_block.style.color = colors[number-1];

            if (number) chosen_block.innerHTML = `${number}`;
            else {
                for (let i = -1; i <= 1; i++){
                    for (let j = -1; j <= 1; j++){
                        if (!(i === 0 && j === 0)) block_spread(a+i,b+j);
                    }
                }
            }
        }
    }

    function get_number(a,b){       // Gets the number of bomb from around the block
        let number = 0;
        for (let i = -1; i <= 1; i++){              // The algorithm for searching the neighbours
            for (let j = -1; j <= 1; j++){
                if (!(i === 0 && j === 0) && a + i >= 0 && b + j >= 0 && a + i < 16 && b + j < 30) number += matrix[a+i][b+j] % 2;
            }
        }
        return number;
    }

    restart_button.onclick = function (){       // Reset button
        game_state = true;
        match_start = false;

        radios.forEach((radio) => {
            if (radio.checked) {
                nr_bombs = radio.value;
            }
        });

        defuses_nr.innerHTML = `${parseInt(nr_bombs, 10)}`.padStart(3, '0');
        game_time.innerHTML = "000";
        restart_button.style.backgroundImage = 'url("Img/smile.png")';

        clearInterval(start_time_counter);
        start_time_counter = 0;

        for (let i = 0; i < 16; i++){                  // Resets the matrix
            for (let j = 0; j < 30; j++){
                matrix[i][j] = 0;

                let chosen_block = document.getElementById(`${i}-${j}`);
                chosen_block.innerHTML = null;
                chosen_block.className = null;
                chosen_block.style.backgroundImage = null;
                chosen_block.classList.add("block");
            }
        }
    }

    document.getElementById("sun").onclick = function (){
        document.body.style.backgroundColor = "#f9f9f9";
        document.getElementById("light_dark").style.borderColor = "#050505";
        document.getElementById("diff").style.borderColor = "#050505";
        localStorage.setItem("Screen", "light");
    }
    document.getElementById("moon").onclick = function () {
        document.body.style.backgroundColor = "#050505";
        document.getElementById("light_dark").style.borderColor = "#f9f9f9";
        document.getElementById("diff").style.borderColor = "#f9f9f9";
        localStorage.setItem("Screen", "dark");
    }
}