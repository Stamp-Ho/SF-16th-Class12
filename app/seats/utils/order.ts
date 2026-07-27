/**
 * 인원 수 size(짝수)에 맞춰 ringOrder 배열을 동적 생성
 */
export function generateRingOrder(inputSize: number): number[] {
  // n이 홀수면 n + 1로 짝수화
  const n = inputSize % 2 !== 0 ? inputSize + 1 : inputSize;
  if (n <= 2) return Array.from({ length: n }, (_, i) => i);

  const result: number[] = new Array(n);

  // 1. 고정 예외 구간 (0, 1, 2번 인덱스)
  result[0] = 0;
  result[1] = 2;
  result[2] = 4;

  // 2. 중간 반복 구간 (3번 ~ n-3번 인덱스)
  for (let i = 3; i < n - 2; i++) {
    if (i % 2 !== 0) {
      result[i] = i - 2; // 홀수 인덱스 (3 -> 1, 5 -> 3, 7 -> 5 ...)
    } else {
      result[i] = i + 2; // 짝수 인덱스 (4 -> 6, 6 -> 8, 8 -> 10 ...)
    }
  }

  // 3. 고정 예외 구간 (마지막 2개 인덱스)
  result[n - 2] = n - 1; // n-2 번째 -> n-1
  result[n - 1] = n - 3; // n-1 번째 -> n-3

  return result;
}

/**
 * ringOrder의 역방향 매핑인 reverseRingOrder 배열을 동적 생성
 */
export function generateReverseRingOrder(inputSize: number): number[] {
  const ring = generateRingOrder(inputSize);
  const n = ring.length;
  const reverse = new Array(n);

  for (let i = 0; i < n; i++) {
    reverse[ring[i]] = i;
  }

  return reverse;
}
