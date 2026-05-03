日本語 | [English](README.en.md)

# GenKAI (玄海)

源内 Web (https://github.com/digital-go-jp/genai-web) を改変したリポジトリです。


## 概要

玄海（GenKAI）は、デジタル庁が開発・運用する生成 AI 利活用基盤 (源内) を改変した WebUI です。

業務特化の生成 AI アプリケーションを、迅速かつ安全かつ簡単に利用できる環境を提供します。

クラウドやサーバー等は不使用で、生成 AI の API を呼びだすのを除いてクライアントのみで動作します。

## ドキュメント

### セットアップ

AGENTS.md を参照してください。

### AI アプリ

- [AI アプリの種類](./docs/AIアプリの種類.md)
- [AI アプリ登録手順書](./docs/AIアプリ登録手順書.md)
- [AI アプリ開発ガイド](./docs/AIアプリ開発ガイド.md)
- [AI アプリ API 仕様](./docs/AIアプリAPI仕様.md)

## 関連リンク

- [ガバメント AI、プロジェクト「源内」の構想紹介 - デジタル庁 note 記事](https://digital-gov.note.jp/n/ndc07326b7491)

## License

- Software: Licensed under the [MIT License](LICENSE).
  - AWS Prototyping Program により作成された一部の Lambda・CDK ファイルは [Amazon Software License（ASL）](https://aws.amazon.com/jp/asl/)
    の対象となります。
  - 対象ファイル一覧は [ASL対象ファイル.md](./docs/ASL対象ファイル.md) を参照してください。
- Documentation: Licensed under the [Creative Commons Attribution 4.0 International License](LICENSE-CC-BY) (CC BY 4.0).