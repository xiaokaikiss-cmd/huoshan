import { NextRequest, NextResponse } from 'next/server';
import { assetService } from '@/services/asset-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const asset = await assetService.syncAssetStatus(id);

    return NextResponse.json({
      success: true,
      data: asset,
    });
  } catch (error) {
    console.error('同步素材状态失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '同步失败' },
      { status: 500 }
    );
  }
}
