declare module 'react-native-blob-util' {
  interface RNFetchBlobConfig {
    fileCache?: boolean;
    path?: string;
    addAndroidDownloads?: {
      useDownloadManager: boolean;
      notification: boolean;
      path: string;
      description: string;
    };
  }

  interface RNFetchBlobResponse {
    path(): string;
    data: string;
    base64(): string;
    flush(): void;
  }

  interface ReactNativeBlobUtil {
    config(options: RNFetchBlobConfig): ReactNativeBlobUtil;
    fetch(
      method: string,
      url: string,
      headers?: any,
      body?: any,
    ): Promise<RNFetchBlobResponse>;
    base64: {
      encode(input: string): string;
      decode(input: string): string;
    };
    fs: {
      writeFile(path: string, data: string, encoding?: string): Promise<void>;
      readFile(path: string, encoding?: string): Promise<string>;
      unlink(path: string): Promise<void>;
      exists(path: string): Promise<boolean>;
      dirs: {
        DocumentDir: string;
        CacheDir: string;
        PictureDir: string;
        MovieDir: string;
        DownloadDir: string;
        MusicDir: string;
        DCIMDir: string;
        SDCardDir: string;
        MainBundleDir: string;
        LibraryDir: string;
      };
    };
  }

  const ReactNativeBlobUtil: ReactNativeBlobUtil;
  export default ReactNativeBlobUtil;
}
