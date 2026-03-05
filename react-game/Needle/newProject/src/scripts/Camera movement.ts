// ThirdPersonCamera.ts
import { Behaviour, serializable, GameObject } from "@needle-tools/engine";
import { Vector3, Object3D, Quaternion, MathUtils } from "three";

export class ThirdPersonCamera extends Behaviour {

    @serializable(Object3D)
    target?: Object3D;

    /** Distance behind the player */
    @serializable()
    followDistance: number = 8;

    /** Height above the player */
    @serializable()
    followHeight: number = 4;

    /** Position smoothing */
    @serializable()
    positionDamping: number = 6;

    /** Rotation smoothing */
    @serializable()
    rotationDamping: number = 8;

    /** Look-at height offset */
    @serializable()
    lookAtHeightOffset: number = 1.5;

    private _targetWorldPos: Vector3 = new Vector3();
    private _targetForward: Vector3 = new Vector3();
    private _desiredPos: Vector3 = new Vector3();
    private _lookAtPos: Vector3 = new Vector3();

    start(): void {
        if (!this.target) {
            this.target = GameObject.findByName("Player", this.context.scene) ?? undefined;
        }

        if (!this.target) {
            console.error("ThirdPersonCamera: No target assigned or found.");
        }
    }

    update(): void {
        if (!this.target) return;

        const dt = this.context.time.deltaTime;

        // Get target's world position and forward direction
        this.target.getWorldPosition(this._targetWorldPos);
        this.target.getWorldDirection(this._targetForward);

        // Camera goes BEHIND the player (negate forward)
        this._desiredPos.copy(this._targetWorldPos);
        this._desiredPos.x -= this._targetForward.x * this.followDistance;
        this._desiredPos.z -= this._targetForward.z * this.followDistance;
        this._desiredPos.y = this._targetWorldPos.y + this.followHeight;

        // Smoothly move to desired position
        this.gameObject.position.lerp(
            this._desiredPos,
            1 - Math.exp(-this.positionDamping * dt)
        );

        // Smooth look-at
        this._lookAtPos.copy(this._targetWorldPos);
        this._lookAtPos.y += this.lookAtHeightOffset;

        const prevQuat = this.gameObject.quaternion.clone();
        this.gameObject.lookAt(this._lookAtPos);
        const targetQuat = this.gameObject.quaternion.clone();

        this.gameObject.quaternion.copy(prevQuat);
        this.gameObject.quaternion.slerp(targetQuat, 1 - Math.exp(-this.rotationDamping * dt));
    }
}