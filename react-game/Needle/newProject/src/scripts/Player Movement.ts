// PlayerMovement.ts
import { Behaviour, serializable } from "@needle-tools/engine";
import { Vector3 } from "three";

export class PlayerMovement extends Behaviour {

    @serializable()
    moveSpeed: number = 5;

    @serializable()
    rotationSpeed: number = 10;

    @serializable()
    useWorldDirection: boolean = true;

    private _moveDirection: Vector3 = new Vector3();
    private _forward: Vector3 = new Vector3();
    private _right: Vector3 = new Vector3();
    private _targetDirection: Vector3 = new Vector3();

    // Track keys manually so camera pointer events don't interfere
    private _keys: { [key: string]: boolean } = {};

    start(): void {
        window.addEventListener("keydown", this._onKeyDown);
        window.addEventListener("keyup", this._onKeyUp);
    }

    onDestroy(): void {
        window.removeEventListener("keydown", this._onKeyDown);
        window.removeEventListener("keyup", this._onKeyUp);
    }

    private _onKeyDown = (e: KeyboardEvent): void => {
        this._keys[e.code] = true;
    };

    private _onKeyUp = (e: KeyboardEvent): void => {
        this._keys[e.code] = false;
    };

    update(): void {
        const dt = this.context.time.deltaTime;

        // Get input axes
        let inputX = 0;
        let inputZ = 0;

        if (this._keys["KeyW"] || this._keys["ArrowUp"]) inputZ += 1;
        if (this._keys["KeyS"] || this._keys["ArrowDown"]) inputZ -= 1;
        if (this._keys["KeyA"] || this._keys["ArrowLeft"]) inputX -= 1;
        if (this._keys["KeyD"] || this._keys["ArrowRight"]) inputX += 1;

        // No input, skip
        if (inputX === 0 && inputZ === 0) return;

        if (this.useWorldDirection && this.context.mainCamera) {
            // Move relative to camera direction (typical third person)
            const cam = this.context.mainCamera;

            // Get camera forward and right (flatten to XZ plane)
            cam.getWorldDirection(this._forward);
            this._forward.y = 0;
            this._forward.normalize();

            this._right.crossVectors(this._forward, new Vector3(0, 1, 0)).normalize();

            // Calculate move direction relative to camera
            this._moveDirection.set(0, 0, 0);
            this._moveDirection.addScaledVector(this._right, inputX);
            this._moveDirection.addScaledVector(this._forward, inputZ);
            this._moveDirection.normalize();
        } else {
            // Simple world-axis movement
            this._moveDirection.set(inputX, 0, inputZ).normalize();
        }

        // Apply movement
        this.gameObject.position.addScaledVector(
            this._moveDirection,
            this.moveSpeed * dt
        );

        // Rotate player to face movement direction
        if (this._moveDirection.lengthSq() > 0.001) {
            this._targetDirection.copy(this.gameObject.position).add(this._moveDirection);
            const prevY = this.gameObject.position.y;

            // Smoothly rotate toward movement direction
            const targetAngle = Math.atan2(this._moveDirection.x, this._moveDirection.z);
            const currentAngle = this.gameObject.rotation.y;

            // Lerp angle
            let angleDiff = targetAngle - currentAngle;

            // Normalize angle difference to [-PI, PI]
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            this.gameObject.rotation.y += angleDiff * Math.min(1, this.rotationSpeed * dt);
        }
    }
}