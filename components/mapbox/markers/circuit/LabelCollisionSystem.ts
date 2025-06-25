import mapboxgl from 'mapbox-gl';

interface Label {
  id: string;
  element: HTMLElement;
  marker: mapboxgl.Marker;
  originalPos: { x: number; y: number };
  currentPos: { x: number; y: number };
  velocity: { x: number; y: number };
  updateLeaderLine: () => void;
}

interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

export class LabelCollisionSystem {
  private labels: Map<string, Label> = new Map();
  private map: mapboxgl.Map;
  private animationFrame: number | null = null;
  private isRunning: boolean = false;
  
  // 물리 시뮬레이션 설정
  private readonly REPULSION_FORCE = 30;      // 밀어내는 힘 (감소)
  private readonly DAMPING = 0.5;             // 감쇠 계수 (증가된 감쇠)
  private readonly MIN_DISTANCE = 5;          // 라벨 간 최소 거리 (감소)
  private readonly SPRING_STRENGTH = 0.02;    // 원래 위치로 돌아가려는 힘 (감소)
  private readonly MAX_DISPLACEMENT = 100;    // 최대 이동 거리 (감소)
  private readonly VELOCITY_THRESHOLD = 0.01; // 움직임 임계값
  
  constructor(map: mapboxgl.Map) {
    this.map = map;
  }
  
  // 라벨 등록
  registerLabel(
    id: string, 
    element: HTMLElement, 
    marker: mapboxgl.Marker,
    updateLeaderLine: () => void
  ) {
    const pos = this.getElementPosition(element);
    
    const label: Label = {
      id,
      element,
      marker,
      originalPos: { ...pos },
      currentPos: { ...pos },
      velocity: { x: 0, y: 0 },
      updateLeaderLine
    };
    
    this.labels.set(id, label);
  }
  
  // 요소의 현재 위치 가져오기
  private getElementPosition(element: HTMLElement): { x: number; y: number } {
    const left = parseFloat(element.style.left) || 0;
    const top = parseFloat(element.style.top) || 0;
    return { x: left, y: top };
  }
  
  // 요소의 경계 영역 가져오기
  private getBounds(label: Label): Bounds {
    const rect = label.element.getBoundingClientRect();
    const parentRect = label.element.offsetParent?.getBoundingClientRect() || { left: 0, top: 0 };
    
    return {
      left: label.currentPos.x - rect.width / 2,
      right: label.currentPos.x + rect.width / 2,
      top: label.currentPos.y - rect.height / 2,
      bottom: label.currentPos.y + rect.height / 2,
      width: rect.width,
      height: rect.height
    };
  }
  
  // 두 라벨 간 충돌 감지
  private detectCollision(bounds1: Bounds, bounds2: Bounds): boolean {
    return !(
      bounds1.right + this.MIN_DISTANCE < bounds2.left ||
      bounds1.left - this.MIN_DISTANCE > bounds2.right ||
      bounds1.bottom + this.MIN_DISTANCE < bounds2.top ||
      bounds1.top - this.MIN_DISTANCE > bounds2.bottom
    );
  }
  
  // 두 라벨 간 겹침 정도 계산
  private getOverlap(bounds1: Bounds, bounds2: Bounds): { x: number; y: number } {
    const overlapX = Math.min(
      bounds1.right + this.MIN_DISTANCE - bounds2.left,
      bounds2.right + this.MIN_DISTANCE - bounds1.left
    );
    
    const overlapY = Math.min(
      bounds1.bottom + this.MIN_DISTANCE - bounds2.top,
      bounds2.bottom + this.MIN_DISTANCE - bounds1.top
    );
    
    return { x: Math.max(0, overlapX), y: Math.max(0, overlapY) };
  }
  
  // 충돌 해결을 위한 힘 계산
  private calculateRepulsionForce(label1: Label, label2: Label): { x: number; y: number } {
    const bounds1 = this.getBounds(label1);
    const bounds2 = this.getBounds(label2);
    
    if (!this.detectCollision(bounds1, bounds2)) {
      return { x: 0, y: 0 };
    }
    
    // 중심점 간 벡터
    const dx = label1.currentPos.x - label2.currentPos.x;
    const dy = label1.currentPos.y - label2.currentPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    
    // 겹침 정도
    const overlap = this.getOverlap(bounds1, bounds2);
    const overlapMagnitude = Math.sqrt(overlap.x * overlap.x + overlap.y * overlap.y);
    
    // 정규화된 방향 벡터
    const nx = dx / distance;
    const ny = dy / distance;
    
    // 밀어내는 힘 (겹침이 클수록 강하게)
    const forceMagnitude = this.REPULSION_FORCE * (overlapMagnitude / this.MIN_DISTANCE);
    
    return {
      x: nx * forceMagnitude,
      y: ny * forceMagnitude
    };
  }
  
  // 원래 위치로 돌아가려는 스프링 힘
  private calculateSpringForce(label: Label): { x: number; y: number } {
    const dx = label.originalPos.x - label.currentPos.x;
    const dy = label.originalPos.y - label.currentPos.y;
    
    return {
      x: dx * this.SPRING_STRENGTH,
      y: dy * this.SPRING_STRENGTH
    };
  }
  
  // 물리 시뮬레이션 단계
  private simulationStep() {
    const labels = Array.from(this.labels.values());
    
    // 1. 모든 라벨에 대한 힘 계산
    labels.forEach(label => {
      let forceX = 0;
      let forceY = 0;
      let hasCollision = false;
      
      // 다른 라벨들과의 충돌 힘
      labels.forEach(otherLabel => {
        if (label.id !== otherLabel.id) {
          const repulsion = this.calculateRepulsionForce(label, otherLabel);
          if (repulsion.x !== 0 || repulsion.y !== 0) {
            hasCollision = true;
            forceX += repulsion.x;
            forceY += repulsion.y;
          }
        }
      });
      
      // 충돌이 있을 때만 힘을 적용
      if (hasCollision) {
        // 원래 위치로의 스프링 힘 (충돌 시에만)
        const spring = this.calculateSpringForce(label);
        forceX += spring.x;
        forceY += spring.y;
        
        // 속도 업데이트 (힘 적용 + 감쇠)
        label.velocity.x = (label.velocity.x + forceX) * this.DAMPING;
        label.velocity.y = (label.velocity.y + forceY) * this.DAMPING;
      } else {
        // 충돌이 없으면 속도를 빠르게 감소
        label.velocity.x *= 0.2;
        label.velocity.y *= 0.2;
      }
    });
    
    // 2. 위치 업데이트
    let hasMovement = false;
    
    labels.forEach(label => {
      // 새 위치 계산
      const newX = label.currentPos.x + label.velocity.x;
      const newY = label.currentPos.y + label.velocity.y;
      
      // 최대 이동 거리 제한
      const dx = newX - label.originalPos.x;
      const dy = newY - label.originalPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > this.MAX_DISPLACEMENT) {
        const scale = this.MAX_DISPLACEMENT / distance;
        label.currentPos.x = label.originalPos.x + dx * scale;
        label.currentPos.y = label.originalPos.y + dy * scale;
      } else {
        label.currentPos.x = newX;
        label.currentPos.y = newY;
      }
      
      // DOM 업데이트
      label.element.style.left = `${label.currentPos.x}px`;
      label.element.style.top = `${label.currentPos.y}px`;
      
      // 리더 라인 업데이트
      label.updateLeaderLine();
      
      // 움직임이 있는지 확인 (더 작은 임계값 사용)
      if (Math.abs(label.velocity.x) > this.VELOCITY_THRESHOLD || 
          Math.abs(label.velocity.y) > this.VELOCITY_THRESHOLD) {
        hasMovement = true;
      }
    });
    
    return hasMovement;
  }
  
  // 시뮬레이션 시작
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    const animate = () => {
      if (!this.isRunning) return;
      
      const hasMovement = this.simulationStep();
      
      // 움직임이 있으면 계속 애니메이션
      if (hasMovement) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.isRunning = false;
      }
    };
    
    animate();
  }
  
  // 시뮬레이션 중지
  stop() {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
  
  // 라벨 초기화
  clear() {
    this.stop();
    this.labels.clear();
  }
  
  // 맵 이동/줌 시 재계산
  update() {
    // 모든 라벨의 원래 위치 업데이트
    this.labels.forEach(label => {
      // 여기서는 원래 위치를 유지하고 시뮬레이션만 재시작
    });
    
    this.start();
  }
}