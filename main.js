import { Bodies, Body, Engine, Events, Render, Runner, World } from 'matter-js';
import { FRUITS_BASE } from './suika_fruits';

let FRUITS = FRUITS_BASE;

const engine = Engine.create();
const render = Render.create({
    engine,
    element: document.body,
    options: {
        wireframes: false,
        background: '#F7F4C8',
        width: 620,
        height: 850,
    },
});

const world = engine.world;

function createStaticBodies() {
    const leftWall = Bodies.rectangle(15, 395, 30, 790, {
        isStatic: true,
        render: { fillStyle: '#E6b143' },
    });

    const rightWall = Bodies.rectangle(605, 395, 30, 790, {
        isStatic: true,
        render: { fillStyle: '#E6b143' },
    });

    const ground = Bodies.rectangle(310, 820, 620, 60, {
        isStatic: true,
        render: { fillStyle: '#E6b143' },
    });

    const topLine = Bodies.rectangle(310, 150, 620, 2, {
        isStatic: true,
        isSensor: true,
        render: { fillStyle: '#E6b143' },
        name: 'topLine', // 이름 설정
    });

    World.add(world, [leftWall, rightWall, ground, topLine]);
}

createStaticBodies();

Render.run(render);
Runner.run(Runner.create(), engine);

let currentBody = null;
let currentFruit = null;
let disableAction = false;
let interval = null;
let score = 0;

const scoreElement = document.createElement('div');
scoreElement.style.position = 'absolute';
scoreElement.style.top = '10px';
scoreElement.style.left = '10px';
scoreElement.style.fontSize = '24px';
scoreElement.style.color = '#333';
scoreElement.textContent = `Score: ${score}`;
document.body.appendChild(scoreElement);

function addFruit() {
    const index = Math.floor(Math.random() * 5);
    const fruit = FRUITS[index];

    const body = Bodies.circle(300, 50, fruit.radius, {
        index: index,
        isSleeping: true,
        restitution: 0.08, // 반발 계수
    });

    currentBody = body;
    currentFruit = fruit;

    World.add(world, body);
}

window.onkeydown = (event) => {
    if (disableAction) {
        return;
    }

    switch (event.code) {
        case 'KeyA':
            if (interval) return;

            interval = setInterval(() => {
                if (currentBody.position.x - currentFruit.radius > 30)
                    Body.setPosition(currentBody, {
                        x: currentBody.position.x - 1,
                        y: currentBody.position.y,
                    });
            }, 5);
            break;

        case 'KeyD':
            if (interval) return;

            interval = setInterval(() => {
                if (currentBody.position.x + currentFruit.radius < 590)
                    Body.setPosition(currentBody, {
                        x: currentBody.position.x + 1,
                        y: currentBody.position.y,
                    });
            }, 5);
            break;

        case 'KeyS':
            currentBody.isSleeping = false;
            disableAction = true;

            setTimeout(() => {
                addFruit();
                disableAction = false;
            }, 1000);
            break;
    }
};

window.onkeyup = (event) => {
    switch (event.code) {
        case 'KeyA':
        case 'KeyD':
            clearInterval(interval);
            interval = null;
    }
};

Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach((collision) => {
        const { bodyA, bodyB } = collision;

        // topLine과 충돌했는지 확인
        if (!disableAction && (bodyA.name === 'topLine' || bodyB.name === 'topLine')) {
            alert('Game over');
            disableAction = true; // 게임 오버 후 추가 액션 방지
            World.clear(world); // 게임 오버 시 월드 초기화
            Engine.clear(engine); // 엔진 초기화

            // 월드 및 엔진 재설정
            engine.events = {};
            World.add(engine.world, []);
            createStaticBodies();
            addFruit();
            disableAction = false;
            return;
        }

        // 과일 병합 로직 처리
        if (bodyA.index !== undefined && bodyB.index !== undefined && bodyA.index === bodyB.index) {
            const index = bodyA.index;

            if (index === FRUITS.length - 1) {
                return;
            }

            World.remove(world, [bodyA, bodyB]);

            const newFruit = FRUITS[index + 1];
            const newBody = Bodies.circle(
                collision.collision.supports[0].x,
                collision.collision.supports[0].y,
                newFruit.radius,
                {
                    index: index + 1,
                }
            );

            World.add(world, newBody);

            // 점수 계산
            const points = Math.floor(newFruit.radius * 10);
            score += points;

            // 점수 업데이트
            scoreElement.textContent = `Score: ${score}`;
        }
    });
});

// 마우스 클릭 이벤트 추가
window.addEventListener('mousedown', () => {
    if (disableAction || !currentBody) return;

    currentBody.isSleeping = false; // 현재 과일 떨어뜨리기
    disableAction = true;

    setTimeout(() => {
        addFruit(); // 새로운 과일 추가
        disableAction = false;
    }, 1000);
});

// 마우스 이동 이벤트 추가
window.addEventListener('mousemove', (event) => {
    if (disableAction || !currentBody || !currentFruit) return;

    // 화면 경계를 고려한 마우스 x 좌표 계산
    const canvasRect = render.canvas.getBoundingClientRect();
    const mouseX = event.clientX - canvasRect.left;

    // 경계 설정 (30px ~ 590px)
    const clampedX = Math.max(30 + currentFruit.radius, Math.min(mouseX, 590 - currentFruit.radius));

    // 객체 위치 업데이트
    Body.setPosition(currentBody, {
        x: clampedX,
        y: currentBody.position.y,
    });
});

addFruit();
