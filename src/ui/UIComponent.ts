/**
 * Base class for all UI components
 */
export class UIComponent {
  protected x: number;
  protected y: number;
  protected width: number;
  protected height: number;
  protected visible: boolean = true;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  /**
   * Update component state
   * @param deltaTime Time passed since last update in ms
   */
  public update(deltaTime: number): void {
    // Base implementation does nothing, to be overridden by subclasses
  }

  /**
   * Render the component
   * @param ctx Canvas rendering context
   */
  public render(ctx: CanvasRenderingContext2D): void {
    // Base implementation does nothing, to be overridden by subclasses
  }

  /**
   * Set the visibility state of the component
   * @param visible True to make component visible, false to hide
   */
  public setVisible(visible: boolean): void {
    this.visible = visible;
  }

  /**
   * Check if the component is currently visible
   * @returns Visibility state
   */
  public isVisible(): boolean {
    return this.visible;
  }

  /**
   * Set the position of the component
   * @param x X coordinate
   * @param y Y coordinate
   */
  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  /**
   * Set the size of the component
   * @param width Width in pixels
   * @param height Height in pixels
   */
  public setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  /**
   * Get the position of the component
   * @returns Object with x and y coordinates
   */
  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  /**
   * Get the size of the component
   * @returns Object with width and height
   */
  public getSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /**
   * Get the x coordinate of the component
   * @returns X coordinate
   */
  public getX(): number {
    return this.x;
  }

  /**
   * Get the y coordinate of the component
   * @returns Y coordinate
   */
  public getY(): number {
    return this.y;
  }

  /**
   * Get the width of the component
   * @returns Width in pixels
   */
  public getWidth(): number {
    return this.width;
  }

  /**
   * Get the height of the component
   * @returns Height in pixels
   */
  public getHeight(): number {
    return this.height;
  }

  /**
   * Check if a point is inside the component bounds
   * @param x X coordinate to check
   * @param y Y coordinate to check
   * @returns True if point is inside the component
   */
  public containsPoint(x: number, y: number): boolean {
    return (
      x >= this.x &&
      x <= this.x + this.width &&
      y >= this.y &&
      y <= this.y + this.height
    );
  }
}
