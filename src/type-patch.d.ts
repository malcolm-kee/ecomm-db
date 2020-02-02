declare module 'mkdirp' {
  function mkdirp(dir: string): Promise<void>;

  export = mkdirp;
}
