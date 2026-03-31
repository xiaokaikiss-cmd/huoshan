import { NextResponse } from 'next/server';
import { assetService } from '@/services/asset-service';

export async function POST() {
  try {
    await assetService.syncProcessingAssets();

    return NextResponse.json({
      success: true,
      message: '同步完成',
    });
  } catch (error) {
    console.error('批量同步失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '同步失败' },
      { status: 500 }
    );
  }
}
