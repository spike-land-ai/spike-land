declare module "jstat" {
  interface Distribution {
    cdf: (x: number, ...params: number[]) => number;
    pdf: (x: number, ...params: number[]) => number;
    inv: (p: number, ...params: number[]) => number;
  }

  interface JStat {
    chisquare: Distribution;
    normal: Distribution;
  }

  const jStat: JStat;
  export default jStat;
}
